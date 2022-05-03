import * as moment from "moment";
import React, { useEffect, useState } from "react";

import { OverviewTask, User } from "../../common/protocol";
import { request } from "../../common/request";
import { Badge, Button, Icon, Input, Row, Table, TableColumn } from "../../components";

const { Select, DatePicker } = Input;
import './index.css';

type TFilter = {
  startDate: string,
  endDate: string,
  memberKey: string,
  taskKey: string
}

const InitialFilter = {
  startDate: moment().subtract(1, 'M').format('YYYY-MM'),
  endDate: moment().add(1, 'M').format('YYYY-MM'),
  memberKey: '',
  taskKey: ''
}

export default function overview() {
  const [filter, setFilter] = useState<TFilter>(InitialFilter);
  const [tasks, setTasks] = useState<OverviewTask[]>([]);
  const [filterTasks, setFilterTasks] = useState<OverviewTask[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const taskSchema: TableColumn[] = [
    { label: '项目', dataIndex: 'name', width: '10%' },
    { label: '完成时间', dataIndex: 'deadline', style: { wordBreak: 'break-all' }, width: '10%' },
    { label: '负责人', dataIndex: 'leader', width: '10%'},
    {
      label: '细分任务',
      dataIndex: 'describe',
      renderer: (record: any, _: number, __: number) => renderTable(record.taskSlice, 'describe'),
      style: { padding: 0 },
      width: '35%'
    },
    {
      label: '开始时间',
      dataIndex: 'startTime',
      renderer: (record: any, _: number, __: number) => renderTable(record.taskSlice, 'startTime'),
      style: { padding: 0 },
      width: '10%'
    },
    {
      label: '完成时间',
      dataIndex: 'endTime',
      renderer: (record: any, _: number, __: number) => renderTable(record.taskSlice, 'endTime'),
      style: { padding: 0 },
      width: '10%'
    },
    {
      label: '成员',
      dataIndex: 'member',
      renderer: (record: any, _: number, __: number) => renderTable(record.taskSlice, 'member'),
      style: { padding: 0 },
      width: '10%'
    },
    {
      label: '项目状态',
      dataIndex: 'state',
      renderer: (record: any, _: number, __: number) => renderTable(record.taskSlice, 'state'),
      style: { padding: 0 },
      width: '5%'
    },
  ];

  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, []);

  const fetchUsers = () => {
    request({
      url: '/admin/user/list',
      success: (data: User[]) => {
        setUsers(data);
      }
    });
  };

  const composeMember = (task: any) => {
    let finalMembers: string[] = [];
    if(typeof task.creator == 'object' && !finalMembers.includes(task.creator.name)) {
      finalMembers.push(task.creator.name)
    }
    if(typeof task.developer == 'object' && !finalMembers.includes(task.developer.name)) {
      finalMembers.push(task.developer.name)
    }
    if(typeof task.tester == 'object' && !finalMembers.includes(task.tester.name)) {
      finalMembers.push(task.tester.name)
    }
    return finalMembers.join(', ');
  }

  const getTaskLeader = (members: any[]) => {
    let temp = '';
    for(let i = 0; i < members.length; i++) {
      if(members[i].isAdmin) {
        temp += temp === '' ? members[i].user.name : `，${members[i].user.name}`;
      }
    }
    return temp;
  }

  const fetchTasks = () => {
    request({
      url: '/api/project/totalDetail',
      success: (data: any[]) => {
        const formatData = data.map(task => {
          return ({
            id: task.id,
            name: task.name,
            deadline: task.finish,
            leader: getTaskLeader(task.members),
            taskSlice: task.task.map((sliceTask: any) => {
              return ({
                describe: sliceTask.name,
                member: composeMember(sliceTask),
                startTime: sliceTask.startTime,
                endTime: sliceTask.endTime,
                state: sliceTask.state
              })
            })
          })
        })
        setTasks(formatData as OverviewTask[]);
      }
    });
  };

  const translateProjectStatus = (status: number) => {
    switch (status) {
      case 0: return <Badge>待办中</Badge>; break;
      case 1: return <Badge theme='warning'>进行中</Badge>; break;
      case 2: return <Badge theme='primary'>测试中</Badge>; break;
      case 3: return <Badge theme='success'>已完成</Badge>; break;
      default: return <Badge>待办中</Badge>;
    }
  }

  const renderTable = (record: any, key: string) => {
    return (
      <ul>
        {record.map((task: any, i: number) =>
          <li key={i} >
            { key == 'state' ? translateProjectStatus(task[key]) : task[key] }
          </li>
        )}
      </ul>
    )
  }

  const handleStartDateChange = (date: string) => {
    setFilter({
      ...filter,
      startDate: date
    })
  }

  const handleEndDateChange = (date: string) => {
    setFilter({
      ...filter,
      endDate: date
    })
  }

  const handleMemberChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    const memberKey = ev.target.value;
    setFilter({
      ...filter,
      memberKey
    })
  }

  const handleTaskChange = (taskKey: string) => {
    setFilter({
      ...filter,
      taskKey
    })
  }

  const reloadFilter = () => {
    setFilter(InitialFilter);
    setFilterTasks(null);
  }

  const findTask = () => {
    const { startDate, endDate, memberKey, taskKey } = filter;
    const taskReg = new RegExp(taskKey, 'i');
    const memberReg = new RegExp(memberKey, 'i');
    const filteringResults = [];
    for(let task of tasks) {
      let taskSlice = [];
      for(let slice of task.taskSlice) {
        if ((taskKey === '' || taskReg.test(slice.describe)) &&
          (memberKey === '' || memberReg.test(slice.member)) &&
          (moment(startDate).isSameOrBefore(slice.startTime)) &&
          (moment(endDate).isSameOrAfter(slice.endTime))
        ) {
          taskSlice.push(slice);
        }
      }
      if (taskSlice.length !== 0) {
        filteringResults.push({
          deadline: task.deadline,
          id: task.id,
          leader: task.leader,
          name: task.name,
          taskSlice
        })
      }
    }
    setFilterTasks(filteringResults);
  }

  const exportTask = () => {
    console.log('export func')
  }

  return (
    <div>
      <div style={{ padding: '8px', borderBottom: '1px solid #E2E2E2' }}>
        <Row flex={{ align: 'middle', justify: 'center' }}>
          <div style={{ marginRight: '1em' }}>
            <label className='mr-1'>开始时间</label>
            <DatePicker style={{ width: 128 }} name='startDate' mode={['year', 'month']} value={filter.startDate} onChange={handleStartDateChange}/>
          </div>
          <div style={{ marginRight: '1em' }}>
            <label className='mr-1'>截至时间</label>
            <DatePicker style={{ width: 128 }} name='endDate' mode={['year', 'month']} value={filter.endDate} onChange={handleEndDateChange}/>
          </div>
          <div style={{ marginRight: '1em' }}>
            <label className='mr-1'>选择成员</label>
            <Select style={{ width: 128 }} value={filter.memberKey} onChange={handleMemberChange}>
              <option key={'none'} value={''}>无</option>
              {users.map(user => <option key={user.id} value={user.account}>{user.account}</option>)}
            </Select>
          </div>
          <div className='ml-3' style={{ marginRight: '1em' }}>
            <label className='mr-1'>任务名</label>
            <Input style={{ width: 150 }} value={filter.taskKey} onChange={handleTaskChange} />
          </div>
          <div>
            <Button size='sm' onClick={reloadFilter}><Icon className='mr-1' type='reload' />重置</Button>
            <Button size='sm' theme={'primary'} onClick={findTask}><Icon className='mr-1' type='search' />查找</Button>
            <Button size='sm' theme={'primary'} onClick={exportTask}><Icon className='mr-1' type='export' />导出</Button>
          </div>
        </Row>
      </div>
      <div className="overview-table">
        <Table dataSource={filterTasks || tasks} columns={taskSchema} pagination={15} />
      </div>
    </div>
  );
}
