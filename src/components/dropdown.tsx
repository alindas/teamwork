import * as React from 'react';

import {makeClass} from './basic';
import './dropdown.css';

interface DropdownProps extends React.HTMLAttributes<any> {
    label: React.ReactNode;
    right?: boolean;
    trigger?: 'hover'|'click';
    onHide?: () => void;
};

export const Dropdown = (props: DropdownProps) => {
    const {label, right, trigger, onHide, className, children, ...nativeProps} = props;
    const [visible, setVisible] = React.useState<boolean>(false);

    const closeContentWindow = () => {
        if(!visible) {
            setVisible(false);
            onHide && onHide();
        }
        window.removeEventListener('click', closeContentWindow);
    }

    const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        // 点击外部区域关闭当前选择框
        e.stopPropagation();
        if (trigger == 'click') {
            if (visible && onHide) {
                onHide();
            }
            if (visible) {
                window.removeEventListener('click', closeContentWindow);
            }
            else {
                window.addEventListener('click', closeContentWindow);
            }
            setVisible(prev => !prev);
        }
    }

    const handleHover = () => {
        if (trigger != 'click') {
            setVisible(true);
        }
    };

    const handleLeave = (e: any) => {
        // console.log(e.relatedTarget);
        // console.log(e.toElement);

        // 修正子元素是 select 组件时，火狐浏览器移动到 option 会触发 onMouseLeave 事件的问题
        const targetNode = e.relatedTarget || e.toElement;
        if (!targetNode || targetNode === window) {
            return;
        }
        if (trigger != 'click') {
            if (visible && onHide) onHide();
            setVisible(false);
        }
    };

    return (
        <div {...makeClass('dropdown', className)} {...nativeProps} onMouseLeave={handleLeave} onClick={(e) => e.stopPropagation()}>
            <div className='dropdown-label' onClick={handleClick} onMouseEnter={handleHover}>{label}</div>
            <div className={`anchor${visible?'':' hide'}`}>
                <div className='dropdown-content r-1' style={right?{left: 'auto', right: 0}:undefined}>
                    {children}
                </div>
            </div>
        </div>
    );
};
