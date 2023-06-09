import * as React from 'react';

import {Row, Card, TableColumn, Input, Table, Button, Icon, Modal, Form, FormProxy, FormFieldValidator, Notification} from '../../components';
import {User} from '../../common/protocol';
import {request} from '../../common/request';
import './index.css';

export const AdminPage = () => {
    const [users, setUsers] = React.useState<User[]>([]);
    const isUnmounted = React.useRef(false);

    React.useEffect(() => {
        fetchUsers();
        return () => {
            isUnmounted.current = true;
        }
    }, []);

    const userSchema: TableColumn[] = [
        {label: '昵称', dataIndex: 'name'},
        {label: '帐号', dataIndex: 'account'},
        {label: '是否是内置帐号', align: 'center', renderer: (data: User) => <label>{data.isBuildin?'是':'否'}</label>},
        {label: '管理员', align: 'center', renderer: (data: User) => <Input.Switch on={data.isSu} disabled={false} onChange={() => changeUserPower(data)}/>},
        {label: '操作', renderer: (data: User) => (
            <span>
                <a className='link' onClick={() => editUser(data)}>重置</a>
                <div className='divider-v'/>
                <a className='link' style={data.isLocked ? {color: '#5fb878'} : {}} onClick={() => toggleUserLock(data)}>{data.isLocked?'解锁':'禁用'}</a>
                <div className='divider-v'/>
                <a className='link' onClick={() => delUser(data)}>删除</a>
            </span>
        )}
    ];

    const fetchUsers = () => {
        request({
            url: '/admin/user/list',
            success: (data: User[]) => {
                !isUnmounted.current && setUsers(data.sort((a, b) => a.account.localeCompare(b.account)));
            }
        });
    };

    const addUser = () => {
        let form: FormProxy = null;
        let closer: () => void = null;

        const validator: {[k: string]: FormFieldValidator} = {
            account: {
                required: '帐号不可为空',
                length: {min: 2, max: 32, message: '帐号最大32个字符'},
                pattern: {test: /[\w\d_]+/, message: '帐号格式非法，只能使用数字、字母及下划线'}
            },
            name: {
                required: '显示昵称不可为空',
                length: {min: 2, max: 32, message: '昵称最大32个字符'}
            },
            pswd: {
                required: '密码不可为空',
            },
            cfmPswd: {
                required: '请再次确认密码',
                equalWith: {field: 'pswd', message: '两次输入的密码不一致'}
            }
        };

        const submit = (ev: React.FormEvent<HTMLFormElement>) => {
            ev.preventDefault();
            request({
                url: `/admin/user`,
                method: 'POST',
                data: new FormData(ev.currentTarget),
                success: () => {
                    fetchUsers();
                    closer();
                }
            });
        };

        closer = Modal.open({
            title: '添加用户（仅可添加内置帐号）',
            body: (
                <Form style={{width: 400}} form={() => {form = Form.useForm(validator); return form}} onSubmit={submit}>
                    <Form.Field htmlFor='account' label='帐号'>
                        <Input name='account'/>
                    </Form.Field>
                    <Form.Field htmlFor='name' label='昵称'>
                        <Input name='name'/>
                    </Form.Field>
                    <Form.Field htmlFor='pswd' label='初始登录密码'>
                        <Input.Password name='pswd'/>
                    </Form.Field>
                    <Form.Field htmlFor='cfmPswd' label='再次确认密码'>
                        <Input.Password name='cfmPswd'/>
                    </Form.Field>
                    <Form.Field htmlFor='isSu'>
                        <Input.Checkbox name='isSu' label='拥有超级管理员权限' value='1' checked/>
                    </Form.Field>
                </Form>
            ),
            onOk: () => {form.submit(); return false},
        });
    };

    const editUser = (user: User) => {
        Modal.open({
            title: '密码重置确认',
            body: <div className='my-2'>密码将被重置为 【123456】，是否继续？</div>,
            onOk: () => {
                request({
                    url: `/admin/user/${user.id}/rstpsw`,
                    method: 'PUT',
                    success: () => Notification.alert('已将密码重置为 123456', 'info')
                });
            }
        });
    };

    const toggleUserLock = (user: User) => {
        request({url: `/admin/user/${user.id}/lock`, method: 'PUT', success: fetchUsers});
    };

    const delUser = (user: User) => {
        Modal.open({
            title: '删除确认',
            body: <div className='my-2'>确定要删除用户【{user.name}】吗？</div>,
            onOk: () => {
                request({url: `/admin/user/${user.id}`, method: 'DELETE', success: fetchUsers});
            }
        });
    };

    const changeUserPower = (user: User) => {
        const formData = new FormData;
        formData.append('account', user.account);
        formData.append('name', user.name);
        formData.append('isSu', user.isSu ? '0' : '1');
        request({
            url: `/admin/user/${user.id}`,
            method: 'PUT',
            data: formData,
            success: () => {
                fetchUsers();
            }
        });
    }

    return (
        <div className='m-4'>
            <Card
                className='admin-table-container'
                bodyProps={{className: 'px-2 py-3'}}
                header={
                    <Row flex={{align: 'middle', justify: 'space-between'}}>
                        <label><Icon type='idcard' className='mx-2'/>用户列表</label>
                        <Button theme='link' onClick={addUser}><Icon type='plus' className='mr-1'/>添加用户</Button>
                    </Row>}
                bordered
                shadowed
            >
                <Table dataSource={users} columns={userSchema} pagination={15}/>
            </Card>
        </div>
    );
};
