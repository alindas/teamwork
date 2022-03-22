import * as React from 'react';

import { Layout, Icon, Menu, Empty, Badge, Row, Button, FormProxy, FormFieldValidator, Modal, Form, Input, Col, Card } from '../../components';
import { Project } from '../../common/protocol';
import { request } from '../../common/request';
import { ProjectRole } from '../../common/consts';

import { Summary } from './summary';
import { Tasks } from './tasks';
import { Manager } from './manager';
import { Milestones } from './milestones';
import { Weeks } from './week';
import './index.css';

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

export const ProjectPage = (props: { uid: number }) => {
    const [projs, setProjs] = React.useState<Project[]>([]);
    const [page, setPage] = React.useState<JSX.Element>();
    const [ifShowCartoon, setIfShowCartoon] = React.useState(false);

    React.useEffect(() => {
        fetchProjs();
    }, []);

    const fetchProjs = () => {
        setPage(null);
        request({
            url: '/api/project/mine', success: function (data: Project[]) {
                data.sort((a: Project, b: Project) => b.id - a.id);
                setProjs(data);
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
                    <input name='admin' value={props.uid} hidden />

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
        setPage(null);
        setIfShowCartoon(true);
    }

    const projectList = projs.length == 0 ? <Empty label='您还未加入任何项目' /> : (
        <Row space={8} style={{ padding: '10px 20px' }} className={ifShowCartoon ? 'fill-in' : ''}>
            {projs.map((project, i) => {
                const target = project.members.find(member => member.user.id == props.uid);
                let isAdmin = target !== undefined ? target.isAdmin : false;
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
                                    <span style={{ color: ColorPool[i % ColorPool.length], fontSize: '16px', fontWeight: '600' }}>{project.name}</span>
                                </div>
                                <div>
                                    <Badge theme='info'>{isAdmin ? '管理员' : '成员'}</Badge>
                                </div>
                            </Row>
                            <Row
                                flex={{ justify: 'space-between' }}
                                className='cloak'
                            >
                                <div onClick={() => setPage(<Summary proj={project} isAdmin={isAdmin} backOff={backOff}/>)}><span>项目概览</span></div>
                                <div onClick={() => setPage(<Tasks proj={project} isAdmin={isAdmin} backOff={backOff} />)}><span>任务列表</span></div>
                                <div onClick={() => setPage(<Milestones proj={project} isAdmin={isAdmin} backOff={backOff} />)}><span>里程计划</span></div>
                                <div onClick={() => setPage(<Weeks pid={project.id} isAdmin={isAdmin} backOff={backOff} />)}><span>周报统计</span></div>
                                {isAdmin && <div onClick={() => setPage(<Manager pid={project.id} onDelete={fetchProjs} backOff={backOff} />)}><span>项目管理</span></div>}
                            </Row>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    )

    return (
        <Layout style={{ width: '100%', height: '100%' }}>
            <div style={!!page ? { height: 0 } : {}} className='project-header'>
                <Row flex={{ align: 'middle' }}>
                    <label className='text-bold fg-muted' style={{ padding: '8px 0', fontSize: '1.2em' }}><Icon type='pie-chart' className='mr-2' />项目列表</label>
                    <Button theme='link' size='sm' onClick={addProj}>
                        <Icon type='plus' className='mr-1' />新建
                    </Button>
                </Row>
            </div>
            <Layout.Content>
                {page || projectList}
            </Layout.Content>
        </Layout>
    );
};
