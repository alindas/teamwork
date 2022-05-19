import * as React from 'react';
import {
    Switch,
    Route,
    HashRouter,
    Redirect,
} from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';

import { Avatar, Badge, Drawer, Layout, Menu, Icon } from '../../components';
import { request } from '../../common/request';
import { User, Notice } from '../../common/protocol';
import { UserPage } from '../user';
import { update } from '../../model/reducers/user';
import { TaskPage } from '../task';
import { ProjectPage } from '../project';
import { DocumentPage } from '../document';
import { SharePage } from '../share';
import { AdminPage } from '../admin';
import OverviewPage from '../overview';

export interface MainMenu {
    name: string;
    id: string;
    click: () => void;
    icon?: string;
    needAdmin?: boolean;
};

export const Home = () => {
    const [currentMenu, setCurrentMenu] = React.useState('');
    const [notices, setNotices] = React.useState<Notice[]>([]);
    const user: User = useSelector((state: any) => state.user);
    const dispatch = useDispatch();

    React.useEffect(() => {
        fetchUserInfo();
        fetchNotices();
        setInterval(fetchNotices, 60000);
    }, []);

    const fetchUserInfo = () => {
        request({ url: '/api/user', success: (data) => dispatch(update(data)), showLoading: false });
    };

    const fetchNotices = () => {
        request({ url: '/api/notice/list', success: setNotices, showLoading: false });
    };

    const changeMenu = (route: string) => {
        setCurrentMenu(route);
        window.location.href = '#/' + route;
    }

    const openProfiler = () => {
        Drawer.open({
            width: 350,
            header: '用户信息',
            body: <UserPage
                user={user}
                notices={notices}
                onInfoChanged={fetchUserInfo}
                onNoticeChanged={fetchNotices} />,
        });
    };

    const menus: MainMenu[] = [
        { name: '总览', id: 'overview', icon: 'table', click: () => changeMenu('overview') },
        { name: '工作台', id: 'task', icon: 'dashboard', click: () => changeMenu('task') },
        { name: '项目', id: 'project', icon: 'pie-chart', click: () => changeMenu('project') },
        { name: '文档', id: 'document', icon: 'read', click: () => changeMenu('document') },
        { name: '分享', id: 'share', icon: 'cloud-upload', click: () => changeMenu('share') },
        { name: '管理', id: 'admin', icon: 'setting', click: () => changeMenu('admin'), needAdmin: true },
    ];

    return (
        <Layout style={{ width: '100vw', height: '100vh' }}>
            <Layout.Sider width={64}>
                <div className='text-center mt-3 mb-1'>
                    <div onClick={openProfiler}>
                        <Avatar size={48} src={user.avatar} />
                        {notices.length > 0 && <div style={{ marginTop: -20 }}><Badge theme='danger' className='r-1'>{notices.length}</Badge></div>}
                    </div>
                </div>

                <Menu defaultActive={currentMenu || window.location.hash.split('/')[1]} theme='dark'>
                    {user && menus.map(m => {
                        if (m.needAdmin && !user.isSu) return null;

                        return (
                            <Menu.Item className='text-center px-0 py-2' style={{ lineHeight: 'normal' }} key={m.id} id={m.id} title={m.name} onClick={m.click}>
                                <Icon type={m.icon} style={{ fontSize: 24 }} /><br />
                                <label style={{ fontSize: 11 }}>{m.name}</label>
                            </Menu.Item>
                        );
                    })}
                </Menu>

                <div style={{ position: 'absolute', left: 0, bottom: 16, width: '100%', textAlign: 'center' }}>
                    <Icon style={{ fontSize: 24 }} type='export' title='退出' onClick={() => location.href = '/logout'} /><br />
                    <label style={{ fontSize: 11 }}>退出登录</label>
                </div>
            </Layout.Sider>

            <Layout.Content>
                <HashRouter>
                    <Switch>
                        <Route path="/" exact><Redirect to="/task" /></Route>
                        <Route path="/overview" ><OverviewPage changeRoute={setCurrentMenu}/></Route>
                        <Route path="/task" ><TaskPage /></Route>
                        <Route path="/project" ><ProjectPage /></Route>
                        <Route path="/document" ><DocumentPage /></Route>
                        <Route path="/share" ><SharePage /></Route>
                        <Route path="/admin" ><AdminPage /></Route>
                        <Route ><TaskPage /></Route>
                    </Switch>
                </HashRouter>
            </Layout.Content>
        </Layout>
    );
};
