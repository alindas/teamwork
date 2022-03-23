import * as moment from "moment";
import React, { useEffect, useState } from "react";
import { Task, User } from "../../common/protocol";
import { request } from "../../common/request";
import { Badge, Button, Icon, Input, Row, Table, TableColumn } from "../../components";

const { Select, DatePicker } = Input;
import tasksJson from './mock/task.json';
import './index.css';

type TFilter = {
  startDate: string,
  endDate: string,
  member: string,
  task: string
}

const InitialFilter = {
  startDate: moment().add(1, 'd').format('YYYY-MM'),
  endDate: moment().add(1, 'd').format('YYYY-MM'),
  member: '',
  task: ''
}

export default function overview() {
  const [filter, setFilter] = useState<TFilter>(InitialFilter);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const taskSchema: TableColumn[] = [
    { label: '项目', dataIndex: 'name' },
    { label: '完成要求', dataIndex: 'requirements'},
    { label: '完成时间', dataIndex: 'deadline' },
    { label: '负责人', dataIndex: 'leader' },
    { label: '细分任务', dataIndex: 'describe', renderer: (record: any, _: number, __: number) => renderTable(record.taskSlice, 'describe'), style: {padding: 0} },
    { label: '开始时间', dataIndex: 'startTime', renderer: (record: any, _: number, __: number) => renderTable(record.taskSlice, 'startTime'), style: {padding: 0} },
    { label: '完成时间', dataIndex: 'endTime', renderer: (record: any, _: number, __: number) => renderTable(record.taskSlice, 'endTime'), style: {padding: 0} },
    { label: '成员', dataIndex: 'member', renderer: (record: any, _: number, __: number) => renderTable(record.taskSlice, 'name'), style: {padding: 0} },
    { label: '项目状态', dataIndex: 'status', renderer: (record: any, _: number, __: number) => renderTable(record.taskSlice, 'status'), style: {padding: 0} },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    request({
      url: '/admin/user/list',
      success: (data: User[]) => {
        setUsers(data);
      }
    });
  };

  const translateProjectStatus = (status: string) => {
    switch(status) {
      case 'pending': return <Badge>代办中</Badge>; break;
      case 'developing': return <Badge theme='primary'>进行中</Badge>; break;
      case 'finished': return <Badge theme='success'>已完成</Badge>; break;
      case 'testing': return <Badge theme='info'>测试中</Badge>; break;
      default: return <Badge>代办中</Badge>;
    }
  }

  const renderTable = (record: any, key: string) => {
    return (
      <ul>
        { record.map((task: any, i: number) =>
          <li key={i} style={{lineHeight: key == 'describe' ? `${28 * task.member.length}px` : '28px'} }>
            { task[key] ? (key == 'status' ? translateProjectStatus(task[key]) : task[key]) : renderTable(task.member, key) }
          </li>
        )}
      </ul>
    )
  }

  const handleMemberChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    const member = ev.target.value;
    setFilter({
      ...filter,
      member
    })
  }

  const handleTaskChange = (task: string) => {
    setFilter({
      ...filter,
      task
    })
  }

  const reloadFilter = () => {

  }

  return (
    <div>
      <div style={{ padding: '8px', borderBottom: '1px solid #E2E2E2' }}>
        <Row flex={{ align: 'middle', justify: 'center' }}>
          <div style={{ marginRight: '1em' }}>
            <label className='mr-1'>开始时间</label>
            <DatePicker style={{ width: 128 }} name='startDate' mode={['year', 'month']} value={filter.startDate} />
          </div>
          <div style={{ marginRight: '1em' }}>
            <label className='mr-1'>截至时间</label>
            <DatePicker style={{ width: 128 }} name='endDate' mode={['year', 'month']} value={filter.endDate} />
          </div>
          <div style={{ marginRight: '1em' }}>
            <label className='mr-1'>选择成员</label>
            <Select style={{ width: 128 }} value={filter.member} onChange={handleMemberChange}>
              <option key={'none'} value={''}>无</option>
              {users.map(user => <option key={user.id} value={user.account}>{user.account}</option>)}
            </Select>
          </div>
          <div className='ml-3' style={{ marginRight: '1em' }}>
            <label className='mr-1'>任务名</label>
            <Input style={{ width: 150 }} value={filter.task} onChange={handleTaskChange} />
          </div>
          <div>
            <Button size='sm' onClick={() => setFilter(InitialFilter)}><Icon className='mr-1' type='reload' />重置</Button>
            <Button size='sm' theme={'primary'}><Icon className='mr-1' type='search' />查找</Button>
            <Button size='sm' theme={'primary'} ><Icon className='mr-1' type='export' />导出</Button>
          </div>
        </Row>
      </div>
      <div className="overview-table">
        <Table dataSource={tasksJson} columns={taskSchema} pagination={15}/>
      </div>
    </div>
  );
}
