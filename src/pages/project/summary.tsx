import * as React from 'react';
import { useSelector } from 'react-redux';

import { Icon, Button, Card, Row } from '../../components';
import { Project, ProjectSummary } from '../../common/protocol';
import { request } from '../../common/request';
import { MDEditor, MDViewer } from '../../components/bytemd';

export const Summary = () => {
    const [summary, setSummary] = React.useState<ProjectSummary>(null);
    const [isEditingDesc, setEditingDesc] = React.useState<boolean>(false);
    const {projectId, project, isAdmin} = useSelector((state: any) => state.project);

    React.useEffect(() => {
        if (projectId == -1) {
            window.location.href = '#/project';
        } else {
            fetchSummary();
        }
    }, [projectId]);

    const fetchSummary = () => {
        request({
            url: `/api/project/${projectId}/summary`,
            success: setSummary,
        });
    };

    return !summary ? null : (
        <div>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #e2e2e2' }}>
                <label className='text-bold fg-muted' style={{ fontSize: '1.2em' }}>
                    <Icon type='pie-chart' className='mr-1' />【{project.name}】概览
                </label>
            </div>
            <div className='px-3 py-2'>
                <p style={{ fontSize: 15, fontWeight: 'bolder' }}>
                    简介
                    {isAdmin && <Icon type='edit' className='fg-primary ml-1' style={{ fontWeight: 'normal' }} onClick={() => setEditingDesc(prev => !prev)} />}
                </p>
                <div className='p-2'>
                    {isEditingDesc
                        ? <Summary.DescEditor pid={projectId} desc={summary.desc} onCancel={() => setEditingDesc(false)} onModified={fetchSummary} />
                        : <MDViewer content={summary.desc || '管理员很懒，并没写什么描述'} />}
                </div>

                <p style={{ marginTop: 8, fontSize: 15, fontWeight: 'bolder' }}>
                    统计
                </p>

                <div className='p-2'>
                    <Row flex={{ align: 'middle', justify: 'start' }}>
                        <Card className='fg-primary' style={{ width: 80, textAlign: 'center', marginRight: 8 }} header={null} bordered>
                            <p style={{ fontSize: 36, fontWeight: "bold" }}>{summary.members}</p>
                            <p>成员</p>
                        </Card>

                        <Card className='fg-info' style={{ width: 80, textAlign: 'center', marginRight: 8 }} header={null} bordered>
                            <p style={{ fontSize: 36, fontWeight: "bold" }}>{summary.milestones}</p>
                            <p>里程碑</p>
                        </Card>

                        <Card className='fg-warning' style={{ width: 80, textAlign: 'center', marginRight: 8 }} header={null} bordered>
                            <p style={{ fontSize: 36, fontWeight: "bold" }}>{summary.tasks}</p>
                            <p>未完成</p>
                        </Card>

                        <Card className='fg-danger' style={{ width: 80, textAlign: 'center' }} header={null} bordered>
                            <p style={{ fontSize: 36, fontWeight: "bold" }}>{summary.delayed}</p>
                            <p>已逾期</p>
                        </Card>
                    </Row>
                </div>
            </div>
        </div>
    );
};

Summary.DescEditor = (props: { pid: number, desc: string, onCancel: () => void, onModified: () => void }) => {
    const [content, setContent] = React.useState<string>(props.desc || '');

    const modify = () => {
        if (props.desc == content) {
            props.onCancel();
            return;
        }

        let param = new FormData();
        param.append('desc', content);
        request({
            url: `/api/project/${props.pid}/desc`,
            method: 'PUT',
            data: param,
            success: () => {
                props.onCancel();
                props.onModified();
            }
        })
    };

    return (
        <div>
            <div style={{width: '50%', height: '300px'}}>
                <MDEditor content={content} setContent={setContent} />
            </div>
            <div className='mt-2 center-child'>
                <Button theme='primary' size='sm' onClick={modify}>修改</Button>
                <Button size='sm' onClick={props.onCancel}>取消</Button>
            </div>
        </div>
    )
}

