import * as React from 'react';

import { Icon, Layout, Tree, TreeNode, TreeNodeAction, Modal, Input, Badge, Notification, Button, Row } from '../../components';
import { Document } from '../../common/protocol';
import { request } from '../../common/request';
import { MDEditor, MDViewer } from '../../components/bytemd';
import './index.css';

export const DocumentPage = () => {
    const editingStatus = React.useRef({isEditing: false, article: null});
    const [nodes, setNodes] = React.useState<TreeNode[]>([]);
    const [current, setCurrent] = React.useState<Document>(null);
    const [isEditing, setEditing] = React.useState<boolean>(false);
    const [editContent, setEditContent] = React.useState<string>();
    const isUnmounted = React.useRef(false);

    const nodeContextMenu: TreeNodeAction[] = [
        { label: '新建同级', onClick: n => addDoc(n.data ? findNode(n.data.parent) : n) },
        { label: '新建子级', onClick: n => addDoc(n), isEnabled: n => n.data != null },
        { label: '重命名', onClick: n => renameDoc(n.data.id, n.data.title), isEnabled: n => n.data != null },
        { label: '编辑', onClick: n => confirmFetchDetail(n.data, true), isEnabled: n => n.data != null },
        { label: '删除', onClick: n => delDoc(n.data.id), isEnabled: n => n.data != null },
    ];

    // 如果是离开当前文档时没有退出保存，则询问
    React.useEffect(() => {
        fetchAll();
        return () => {
            isUnmounted.current = true;
            if (editingStatus.current.isEditing) {
                if (!confirm('当前文档编辑内容尚未保存，是否保存？')) {
                    restoreDocBeforeLeave(editingStatus.current.article);
                };
            }
        }
    }, []);

    const fetchAll = () => {
        request({
            url: '/api/document/list',
            success: (data: Document[]) => {
                if (isUnmounted.current) {
                    return;
                }
                if (data.length == 0) {
                    setNodes([{ label: '右键新建文档', nodeId: '-1', children: [] }]);
                    return;
                }

                let docs: { [k: number]: Document } = {};
                let children: { [k: number]: number[] } = {};
                data.forEach(d => {
                    docs[d.id] = d;
                    if (children[d.parent] != null) {
                        children[d.parent].push(d.id);
                    } else {
                        children[d.parent] = [d.id];
                    }
                });

                const makeTreeNode = (id: number) => {
                    let ret: TreeNode[] = [];
                    let sub = children[id] || [];
                    sub.forEach(s => ret.push({
                        label: docs[s].title,
                        nodeId: `${s}`,
                        data: docs[s],
                        children: makeTreeNode(s),
                    }));
                    return ret;
                };

                setNodes(makeTreeNode(-1));
            }
        });
    };

    const fetchDetail = (doc: Document, editingMode: boolean) => {
        if (!doc) return;
        request({
            url: `/api/document/${doc.id}`,
            success: (data: Document) => {
                setCurrent(data);
                editingStatus.current.isEditing = editingMode;
                editingStatus.current.article = data;
                setEditing(editingMode);
                setEditContent(data.content);
            }
        });
    };

    const confirmFetchDetail = (doc: Document, editingMode: boolean) => {
        // 如果跳转的文档不是当前文档，则考虑是否还处于编辑状态
        if (current !== null && doc.id != current.id && isEditing) {
            Modal.open({
                title: '当前文档编辑内容尚未保存，是否保存？',
                icon: 'warning',
                showClose: false,
                onOk: () => fetchDetail(doc, editingMode),
                onCancel: () => {
                    restoreDocBeforeLeave();
                    fetchDetail(doc, editingMode);
                }
            });
        } else {
            fetchDetail(doc, editingMode);
        }
    };

    const isValidName = (name: string) => {
        if (!name || name.length == 0) return { ok: false, err: '文档名不可为空' };

        const findNodeByName = (list: TreeNode[]) => {
            for (let i = 0; i < list.length; ++i) {
                if (list[i].label == name) return true;
                if (findNodeByName(list[i].children)) return true;
            }

            return false;
        }

        if (findNodeByName(nodes)) return { ok: false, err: `同级目录下，已存在文档名为【${name}】` };
        return { ok: true };
    };

    const findNode = (id: number) => {
        if (id == -1) return { label: '无', nodeId: '-1', children: [] };

        const finder = (list: TreeNode[]): TreeNode => {
            for (let i = 0; i < list.length; ++i) {
                if (list[i].data.id == id) return list[i];

                let sub = finder(list[i].children);
                if (sub) return sub;
            }

            return null;
        }

        return finder(nodes);
    };

    const addDoc = (parent: TreeNode) => {
        let parentName = parent.data ? parent.data.title : '无';
        let parentId = parent.data ? parent.data.id : -1;
        let name = '';

        Modal.open({
            title: '新建文档',
            body: (
                <table>
                    <tbody style={{ lineHeight: '32px', fontSize: 12 }}>
                        <tr>
                            <td>父节点：</td>
                            <td><Badge theme='info'>{parentName}</Badge></td>
                        </tr>
                        <tr>
                            <td>文档名：</td>
                            <td><Input value={name} onChange={ev => name = ev} /></td>
                        </tr>
                    </tbody>
                </table>
            ),
            onOk: () => {
                let status = isValidName(name);
                if (!status.ok) {
                    Notification.alert(status.err, 'error');
                    return;
                }

                let param = new FormData();
                param.append('title', name);
                param.append('parent', parentId);
                request({ url: '/api/document', method: 'POST', data: param, success: fetchAll });
            },
        });
    };

    const renameDoc = (id: number, oldName: string) => {
        let name = oldName;

        Modal.open({
            title: '重命名文档',
            body: (
                <table>
                    <tbody style={{ lineHeight: '32px', fontSize: 12 }}>
                        <tr>
                            <td>原名称：</td>
                            <td><Badge theme='info'>{oldName}</Badge></td>
                        </tr>
                        <tr>
                            <td>新名称：</td>
                            <td><Input value={name} onChange={ev => name = ev} /></td>
                        </tr>
                    </tbody>
                </table>
            ),
            onOk: () => {
                let status = isValidName(name);
                if (!status.ok) {
                    Notification.alert(status.err, 'error');
                    return;
                }

                if (name == oldName) return;

                let param = new FormData();
                param.append('title', name);
                request({ url: `/api/document/${id}/title`, method: 'PUT', data: param, success: fetchAll });
            },
        });
    };

    const editDoc = (value: string | boolean) => {
        // 如果是保存
        if (value === true) {
            fetchDetail(current, false);
            return;
        }

        // 如果是取消
        let isCancel = false;
        if (value === false) {
            value = current.content;
            isCancel = true;
        } else {
            setEditContent(value);
        }
        if (!isCancel && (!value || value.length == 0 || value == current.content)) return;

        let param = new FormData();
        param.append('content', value);
        request({
            url: `/api/document/${current.id}/content`,
            method: 'PUT',
            data: param,
            showLoading: false,
            success: () => isCancel && fetchDetail(current, false),
        });
    };

    // 尚未保存文档便离开当前文档后取消更新
    const restoreDocBeforeLeave = (currentArticle?: Document | undefined) => {
        let article = currentArticle??current;
        if (!article) return;
        let param = new FormData();
        param.append('content', article.content);
        request({
            url: `/api/document/${article.id}/content`,
            method: 'PUT',
            data: param,
            showLoading: false,
        });
    };

    const delDoc = (id: number) => {
        request({ url: `/api/document/${id}`, method: 'DELETE', success: fetchAll });
        setCurrent(null);
    };

    return (
        <Layout>
            <Layout.Sider width={200} theme='light'>
                <div style={{ padding: 8, borderBottom: '1px solid #E2E2E2' }}>
                    <label className='text-bold fg-muted' style={{ fontSize: '1.2em' }}><Icon type='book' className='mr-2' />文档列表</label>
                </div>

                <div className='p-2'>
                    <Tree nodes={nodes} nodeContextMenu={nodeContextMenu} onSelectNode={n => confirmFetchDetail(n.data, false)} />
                </div>
            </Layout.Sider>

            <Layout.Content>
                {isEditing ? (
                    <div className='mt-3 px-1 document-editor'>
                        <MDEditor content={editContent} setContent={editDoc} />
                        <Row flex={{ align: 'middle', justify: 'center' }}>
                            <Button theme='primary' size='sm' onClick={() => editDoc(true)}>保存修改</Button>
                            <Button theme='default' size='sm' onClick={() => editDoc(false)}>取消</Button>
                        </Row>
                    </div>
                ) : (
                    <div className='mt-3 px-2'>
                        {current && <MDViewer content={current.content} />}
                    </div>
                )}
            </Layout.Content>
        </Layout>
    );
};
