import * as moment from "moment";
import React, { useEffect, useState } from "react";

import { OverviewProject, User } from "../../common/protocol";
import { request } from "../../common/request";
import { Badge, Button, Icon, Input, Row, Table, TableColumn } from "../../components";
import { Gantt } from "./gantt-overview";
import './index.css';

const { Select, DatePicker } = Input;

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
  const [tasks, setTasks] = useState<OverviewProject[]>([]);
  const [filterTasks, setFilterTasks] = useState<OverviewProject[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [useGantt, setUseGantt] = React.useState<boolean>(false);

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
      label: '任务状态',
      dataIndex: 'state',
      renderer: (record: any, _: number, __: number) => renderTable(record.taskSlice, 'state'),
      style: { padding: 0 },
      width: '5%'
    },
  ];

  const gantt = React.useMemo(() => <Gantt projects={filterTasks??[]} onModified={fetchTasks}/>, [filterTasks]);
  const table = React.useMemo(() => <Table dataSource={filterTasks} columns={taskSchema} pagination={15} emptyLabel={filterTasks == null ? '请通过查找按钮获取首屏数据' : '暂无数据'}/>, [filterTasks]);

  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, []);

  const fetchUsers = () => {
    request({
      url: '/api/user/list',
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
                state: sliceTask.state,
                id: sliceTask.id
              })
            })
          })
        })
        setTasks(formatData as OverviewProject[]);
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
      <ul className={key === 'describe' ? 'describe-item' : ''}>
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
          !((moment(startDate).isAfter(slice.endTime.slice(0, -3))) ||
          (moment(endDate).isBefore(slice.startTime.slice(0, -3))))
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
    const data = [
      {
        name: "哈哈",
        age: 1,
        sex: "男",
        companyName: "公司1",
        companyAddress: {
          companyAddressZh:"公司地址中文1",
          companyAddressEn:"公司地址英文1"
        }
      },
      {
        name: "呵呵",
        age: 2,
        sex: "女",
        companyName: "公司2",
        companyAddress: {
          companyAddressZh:"公司地址中文2",
          companyAddressEn:"公司地址英文2"
        }
      },
      {
        name: "嘻嘻",
        age: 3,
        sex: "男",
        companyName: "公司3",
        companyAddress: {
          companyAddressZh:"公司地址中文3",
          companyAddressEn:"公司地址英文3"
        }
      },
      {
        name: "啦啦",
        age: 4,
        sex: "女",
        companyName: "公司4",
        companyAddress: {
          companyAddressZh:"公司地址中文4",
          companyAddressEn:"公司地址英文4"
        }
      }
    ];
    console.log('export func');

  }

  return (
    <div>
      <div className='filter-bar' style={{ padding: '8px', borderBottom: '1px solid #E2E2E2' }}>
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
              {users.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
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
            <Button size='sm' onClick={() => setUseGantt(prev => !prev)}><Icon className='mr-1' type='view'/>{useGantt ? '看板模式' : '甘特图'}</Button>
          </div>
        </Row>
      </div>
      <div className='px-2 mt-3' style={{height: 'calc(100vh - 1rem - 47px'}}>
        { useGantt ? <div className="overview-gantt">{gantt}</div> : <div className="overview-table">{table}</div> }
      </div>
    </div>
  );
}
