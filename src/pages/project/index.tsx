import React, { useEffect, useState } from 'react';
import {
    Switch,
    Route,
    HashRouter,
    Redirect,
} from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';

import { Layout, Icon, Empty, Badge, Row, Button, FormProxy, FormFieldValidator, Modal, Form, Input, Col, Card } from '../../components';
import { Project, User } from '../../common/protocol';
import { request } from '../../common/request';
import { ProjectRole } from '../../common/consts';

import { Summary } from './summary';
import { Tasks } from './tasks';
import { Manager } from './manager';
import { Milestones } from './milestones';
import { Weeks } from './week';
import './index.css';
import { modifyProject, modifyProjectId } from '../../model/reducers/project';

const ColorPool = [
    'Crimson',
    'DarkOrange',
    'SpringGreen',
    'DarkSlateBlue',
    'LightSkyBlue',
    'DimGray',
    'Purple',
    'RoyalBlue',
    'CadetBlue',
    'MediumTurquoise',
    'Gold',
    'Yellow',
    'SaddleBrown',
    'Maroon',
]

export const ProjectPage = () => {
    const [projs, setProjs] = useState<Project[]>([]);
    const [currentMenu, setCurrentMenu] = useState('');
    const isUnmounted = React.useRef(false);
    const dispatch = useDispatch();
    const user: User = useSelector((state: any) => state.user.userInfo);
    const {projectId, isAdmin} = useSelector((state: any) => state.project);

    useEffect(() => {
        fetchProjs();
        if (projectId !== -1 && !currentMenu) {
            setCurrentMenu(window.location.hash.split('/')[2]);
        }
        return () => {
            isUnmounted.current = true;
        }
    }, []);

    const fetchProjs = () => {
        request({
            url: '/api/project/mine', success: function (data: Project[]) {
                if (isUnmounted.current) {
                    return;
                }
                data.sort((a: Project, b: Project) => b.id - a.id);
                setProjs(data);
                // 如果进入项目页时 redux 上存在 projectId 则证明需要进入子页
                if (projectId != -1) {
                    for (let project of data) {
                        if (project.id == projectId) {
                            dispatch(modifyProject({
                                project,
                                isAdmin: project.members.find(member => member.user.id == user.id)
                            }));
                            break;
                        }
                    }
                }
            }
        });
    };

    const addProj = () => {
        let form: FormProxy = null;
        let closer: () => void = null;

        const validates: { [k: string]: FormFieldValidator } = {
            name: { required: '项目名不可为空' },
        };

        const submit = (ev: React.FormEvent<HTMLFormElement>) => {
            ev.preventDefault();
            request({
                url: `/api/project`,
                method: 'POST',
                data: new FormData(ev.currentTarget),
                success: () => {
                    fetchProjs();
                    closer();
                }
            });
        };

        closer = Modal.open({
            title: '新建项目',
            body: (
                <Form style={{ width: 400 }} form={() => { form = Form.useForm(validates); return form }} onSubmit={submit}>
                    <input name='admin' value={user.id} hidden />

                    <Form.Field htmlFor='name' label='项目名'>
                        <Input name='name' />
                    </Form.Field>

                    <Form.Field htmlFor='role' label='担任角色'>
                        <Input.Select name='role'>
                            {ProjectRole.map((r, i) => <option key={i} value={i}>{r}</option>)}
                        </Input.Select>
                    </Form.Field>
                </Form>
            ),
            onOk: () => { form.submit(); return false },
        })
    };

    const backOff = () => {
        dispatch(modifyProjectId(-1));
        window.location.href = '#/project';
    };

    const enterSubItem = (item: string, project: Project, isAdmin: boolean) => {
        setCurrentMenu(item);
        dispatch(modifyProject({
            projectId: project.id,
            project,
            isAdmin
        }));
        window.location.href = '#/project/' + item;
    }

    const switchSubItem = (item: string) => {
        window.location.href = '#/project/' + item;
        setCurrentMenu(item);
    }

    const projectList = projs.length == 0 ? <Empty label='您还未加入任何项目' /> : (
        <Row space={8} style={{ padding: '10px 20px' }}>
            {projs.map((project, i) => {
                const target = project.members.find(member => member.user.id == user.id);
                let isAdminSelf = target !== undefined ? target.isAdmin : false;
                return (
                    <Col span={{ xs: 2 }} style={{ minWidth: 302 }} key={project.id}>
                        <Card
                            headerProps={{ className: 'p-0 fg-white' }}
                            bodyProps={{ className: 'px-1 pb-1' }}
                            shadowed
                            bordered
                            style={{ borderLeft: `4px solid ${ColorPool[i % ColorPool.length]}` }}
                            className='task-container'
                        >
                            <Row flex={{ justify: 'space-between' }} style={{ padding: '12px 8px', flexDirection: 'column' }}>
                                <div className='project-title'>
                                    <span style={{ color: '#1a2a3a', fontSize: '16px', fontWeight: '600' }}>{project.name}</span>
                                </div>
                                <div>
                                    <Badge theme='info'>{isAdminSelf ? '管理员' : '成员'}</Badge>
                                </div>
                            </Row>
                            <Row
                                flex={{ justify: 'space-between' }}
                                className='cloak'
                            >
                                <div onClick={() => enterSubItem('summary', project, isAdminSelf)}><span>项目概览</span></div>
                                <div onClick={() => enterSubItem('tasks', project, isAdminSelf)}><span>任务列表</span></div>
                                <div onClick={() => enterSubItem('milestones', project, isAdminSelf)}><span>里程计划</span></div>
                                <div onClick={() => enterSubItem('weeks', project, isAdminSelf)}><span>周报统计</span></div>
                                {isAdminSelf && <div onClick={() => enterSubItem('manager', project, isAdminSelf)}><span>项目管理</span></div>}
                            </Row>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    )

    return (
        <Layout style={{ width: '100%', height: '100%' }}>
            <div style={projectId == -1 ? {} : { height: 0 }} className='project-header'>
                <Row flex={{ align: 'middle' }}>
                    <label className='text-bold fg-muted' style={{ padding: '8px 16px', fontSize: '1.2em' }}><Icon type='pie-chart' className='mr-2' />项目列表</label>
                    <Button theme='link' size='sm' onClick={addProj}>
                        <Icon type='plus' className='mr-1' />新建
                    </Button>
                </Row>
            </div>
            <div style={projectId !== -1 ? {} : { height: 0 }} className='project-submenu'>
                <Button theme='link' size='sm' onClick={backOff}>
                    <Icon type='backward' />返回
                </Button>
                {
                    projectId !== -1 &&
                    <Row
                        flex={{ justify: 'space-between' }}
                        className={`project-submenu-box current-submenu-${currentMenu}`}
                    >
                        <div onClick={() => switchSubItem('summary')}><span>项目概览</span></div>
                        <div onClick={() => switchSubItem('tasks')}><span>任务列表</span></div>
                        <div onClick={() => switchSubItem('milestones')}><span>里程计划</span></div>
                        <div onClick={() => switchSubItem('weeks')}><span>周报统计</span></div>
                        {isAdmin && <div onClick={() => switchSubItem('manager')}><span>项目管理</span></div>}
                    </Row>
                }
            </div>
            <Layout.Content>
                <HashRouter>
                    <Switch>
                        <Route path="/project" exact>{projectList}</Route>
                        <Route path="/project/summary"><Summary /></Route>
                        <Route path="/project/tasks"><Tasks /></Route>
                        <Route path="/project/milestones"><Milestones /></Route>
                        <Route path="/project/weeks"><Weeks /></Route>
                        <Route path="/project/manager"><Manager onDelete={fetchProjs}/></Route>
                        <Route ><Redirect to="/project" /></Route>
                    </Switch>
                </HashRouter>
            </Layout.Content>
        </Layout>
    );
};
