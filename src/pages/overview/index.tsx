import * as moment from "moment";
import React, { useEffect, useState } from "react";
import { User } from "../../common/protocol";
import { request } from "../../common/request";
import { Button, Icon, Input, Row, Table, TableColumn } from "../../components";

const { Select, DatePicker } = Input;

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
  const [users, setUsers] = useState<User[]>([]);

  const taskSchema: TableColumn[] = [
    {label: '项目', dataIndex: 'name'},
    {label: '完成要求', dataIndex: 'account'},
    {label: '完成时间', dataIndex: 'account'},
    {label: '负责人', dataIndex: 'account'},
    {label: '细分任务', dataIndex: 'account'},
    {label: '开始时间', dataIndex: 'account'},
    {label: '完成时间', dataIndex: 'account'},
    {label: '成员', align: 'center', renderer: (data: User) => <label>{data.isBuildin?'是':'否'}</label>},
    {label: '速度记录', align: 'center', renderer: (data: User) => <Input.Switch on={data.isSu} disabled={true}/>},
];

  useEffect(() => fetchUsers(), []);

  const fetchUsers = () => {
    request({
      url: '/admin/user/list',
      success: (data: User[]) => {
        setUsers(data);
      }
    });
  };

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
        <Row flex={{align: 'middle', justify: 'center'}}>
          <div style={{ marginRight: '1em' }}>
            <label className='mr-1'>开始时间</label>
            <DatePicker style={{ width: 128 }} name='startDate' mode={['year','month']} value={filter.startDate} />
          </div>
          <div style={{ marginRight: '1em' }}>
            <label className='mr-1'>截至时间</label>
            <DatePicker style={{ width: 128 }} name='endDate' mode={['year','month']} value={filter.endDate} />
          </div>
          <div style={{ marginRight: '1em' }}>
            <label className='mr-1'>选择成员</label>
            <Select style={{ width: 128 }} value={filter.member} onChange={handleMemberChange}>
              <option key={'none'} value={''}>无</option>
              { users.map(user => <option key={user.id} value={user.account}>{user.account}</option>) }
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
      <Table dataSource={[]} columns={taskSchema} pagination={15}/>

    </div>
  );
}
