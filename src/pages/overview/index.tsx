import * as moment from "moment";
import React, { useEffect, useState } from "react";
import { Scrollbars } from 'react-custom-scrollbars-2';
import { useDispatch } from "react-redux";

import { OverviewProject, User } from "../../common/protocol";
import { request } from "../../common/request";
import { Badge, Button, Icon, Input, Notification, Row, Table, TableColumn } from "../../components";
import { Gantt } from "./gantt-overview";
import './index.css';
import { downloadFile } from '../../util/common'
import { modifyProjectId } from "../../model/reducers/project";

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

export default function overview(props: {changeRoute: (route: string) => void}) {
  const [filter, setFilter] = useState<TFilter>(InitialFilter);
  const [tasks, setTasks] = useState<OverviewProject[]>([]);
  const [filterTasks, setFilterTasks] = useState<OverviewProject[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [useGantt, setUseGantt] = React.useState<boolean>(false);
  const isUnmounted = React.useRef(false);
  const dispatch = useDispatch();

  const taskSchema: TableColumn[] = [
    { label: '项目',
      dataIndex: 'name',
      width: '10%',
      renderer: (record: any, _: number, __: number) =>
        <span className='project-title' onClick={() => jumpToProject(record.id)}>{record.name}</span>,
    },
    { label: '完成时间', dataIndex: 'deadline', style: { wordBreak: 'break-all' }, width: '10%' },
    { label: '负责人', dataIndex: 'leader', width: '10%' },
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

  useEffect(() => {
    fetchUsers();
    fetchTasks();
    return () => {
      isUnmounted.current = true;
    }
  }, []);

  const fetchUsers = () => {
    request({
      url: '/api/user/list',
      success: (data: User[]) => {
        !isUnmounted.current && setUsers(data);
      }
    });
  };

  const composeMember = (task: any) => {
    let finalMembers: string[] = [];
    if (typeof task.creator == 'object' && !finalMembers.includes(task.creator.name)) {
      finalMembers.push(task.creator.name)
    }
    if (typeof task.developer == 'object' && !finalMembers.includes(task.developer.name)) {
      finalMembers.push(task.developer.name)
    }
    if (typeof task.tester == 'object' && !finalMembers.includes(task.tester.name)) {
      finalMembers.push(task.tester.name)
    }
    return finalMembers.join(', ');
  }

  const getTaskLeader = (members: any[]) => {
    let temp = '';
    for (let i = 0; i < members.length; i++) {
      if (members[i].isAdmin) {
        temp += temp === '' ? members[i].user.name : `，${members[i].user.name}`;
      }
    }
    return temp;
  }

  const fetchTasks = () => {
    request({
      url: '/api/project/totalDetail',
      success: (data: any[]) => {
        if (isUnmounted.current) {
          return;
        }
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

  const jumpToProject = (id: number) => {
    dispatch(modifyProjectId(id));
    window.location.href = '#/project/tasks';
    props.changeRoute('project');
  }

  const translateProjectStatus = (status: number) => {
    switch (status) {
      case 0: return <Badge>待办中</Badge>; break;
      case 1: return <Badge theme='warning'>进行中</Badge>; break;
      case 2: return <Badge theme='primary'>测试中</Badge>; break;
      case 3: return <Badge theme='success'>已完成</Badge>; break;
      default: return <Badge>待办中</Badge>;
    }
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
    for (let task of tasks) {
      let taskSlice = [];
      for (let slice of task.taskSlice) {
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
    if (filterTasks == null || filterTasks.length == 0) {
      Notification.alert('数据为空！', 'warning');
      return;
    }
    else {
      // console.log(filterTasks);
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      // 设置工作簿属性
      workbook.creator = 'LHH';
      workbook.lastModifiedBy = 'LHH';
      const now = moment();
      workbook.created = now;
      workbook.modified = now;
      workbook.lastPrinted = now;

      // 将工作簿添加一个 sheet 页 sheet
      const sheet = workbook.addWorksheet('sheet1');
      // 表头数据添加
      sheet.columns = taskSchema.map(item => ({
        header: item.dataIndex == 'state' ? item.label + '(0: 待办; 1: 进行; 2: 测试; 3: 完成)' : item.label,
        key: item.dataIndex,
        width: (typeof item.width == 'number' ? item.width : parseInt(item.width)) * 2,
        style: {
          alignment: {
            vertical: 'middle'
          }
        }
      }));
      // 设置表头样式
      const theadFontStyle = {
        name: '黑体',
        size: 14
      }
      for (let col of taskSchema) {
        sheet.getRow(1).getCell(col.dataIndex).font = theadFontStyle;
      }
      // 表格内容添加
      let startRow = 2;
      for (let task of filterTasks) {
        task.taskSlice.map(item => {
          sheet.addRow(item);
        });
        /**
         * 合并时间线、负责人和项目名称的单元格
         * 按开始行，开始列，结束行，结束列合并
         *  */
        const endRow = startRow + task.taskSlice.length - 1;
        sheet.mergeCells(startRow, 1, endRow, 1);
        sheet.mergeCells(startRow, 2, endRow, 2);
        sheet.mergeCells(startRow, 3, endRow, 3);
        const deadlineCol = sheet.getRow(endRow).getCell('deadline');
        deadlineCol.value = task.deadline;
        const leaderCol = sheet.getRow(endRow).getCell('leader');
        leaderCol.value = task.leader;
        const nameCol = sheet.getRow(endRow).getCell('name');
        nameCol.value = task.name;
        startRow = startRow + task.taskSlice.length;
      }
      workbook.xlsx.writeBuffer()
        .then((buffer: ArrayBuffer) => {
          downloadFile({
            file: new Blob([buffer], { type: 'application/octet-stream' }),
            name: '任务总览表.xlsx',
          })
        })
    }
  }

  const gantt = React.useMemo(() => <Gantt projects={filterTasks ?? []} onModified={fetchTasks} onRouteChange={jumpToProject}/>, [filterTasks]);
  const table = React.useMemo(() => <Table dataSource={filterTasks} columns={taskSchema} pagination={15} emptyLabel={filterTasks == null ? '请通过查找按钮获取首屏数据' : '暂无数据'} />, [filterTasks]);

  const renderTable = (record: any, key: string) => {
    return (
      <ul className={key === 'describe' ? 'describe-item' : ''}>
        {record.map((task: any, i: number) =>
          <li key={i} >
            {key == 'state' ? translateProjectStatus(task[key]) : task[key]}
          </li>
        )}
      </ul>
    )
  }

  return (
    <div>
      <div className='filter-bar' style={{ padding: '8px', borderBottom: '1px solid #E2E2E2' }}>
        <Row flex={{ align: 'middle', justify: 'center' }}>
          <div style={{ marginRight: '1em' }}>
            <label className='mr-1'>开始时间</label>
            <DatePicker style={{ width: 128 }} name='startDate' mode={['year', 'month']} value={filter.startDate} onChange={handleStartDateChange} />
          </div>
          <div style={{ marginRight: '1em' }}>
            <label className='mr-1'>截至时间</label>
            <DatePicker style={{ width: 128 }} name='endDate' mode={['year', 'month']} value={filter.endDate} onChange={handleEndDateChange} />
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
            <Button size='sm' onClick={() => setUseGantt(prev => !prev)}><Icon className='mr-1' type='view' />{useGantt ? '看板模式' : '甘特图'}</Button>
          </div>
        </Row>
      </div>
      <div className='px-2 mt-3' style={{ height: 'calc(100vh - 1rem)', overflow: 'hidden' }}>
        {useGantt ? <div className="overview-gantt">{gantt}</div> : <div className="overview-table"><Scrollbars>{table}</Scrollbars></div>}
      </div>
    </div>
  );
}
