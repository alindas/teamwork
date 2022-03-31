import React from 'react';

import { Menu } from '../../components/menu';
import { MainMenu } from '../home';

type TSubmenu = {
  menus: MainMenu[]
}

export default function Submenu(props: TSubmenu) {
  const { menus } = props;

  return (
    <Menu defaultActive='task' theme='light'>
      {menus.map(m => {
        return (
          <Menu.Item className='text-center px-0 py-2' style={{ lineHeight: 'normal' }} key={m.id} id={m.id} title={m.name} onClick={m.click}>
            <label style={{ fontSize: 11 }}>{m.name}</label>
          </Menu.Item>
        );
      })}
    </Menu>
  )
}
