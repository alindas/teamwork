import * as React from 'react';

import { makeClass, makeId } from './basic';
import { Icon } from './icon';
import { DateTime } from './datetime';
import { Empty } from './empty';
import './input.css';

interface InputProps {
    disabled?: boolean;

    name?: string;
    className?: string;
    style?: React.CSSProperties;
    addon?: React.ReactNode;
    placeholder?: string;
    autoComplete?: 'on' | 'off';

    value?: string;
    onChange?: (newValue: string) => void;
};

interface CheckBoxProps {
    name?: string;
    label: React.ReactNode;
    value: string;
    className?: string;
    style?: React.CSSProperties;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
};

interface RadioOption {
    label: React.ReactNode;
    value: string;
    disabled?: boolean;
};

interface RadioProps {
    name?: string;
    className?: string;
    style?: React.CSSProperties;
    options: RadioOption[];
    value?: string;
    onChange?: (newValue: string) => void;
};

interface SelectProps {
    name?: string;
    className?: string;
    style?: React.CSSProperties;
    value?: string | number;
    onChange?: (value: number | string) => void;
    options?: {
        label: string | number,
        value: string | number
    }[]
};

interface SwitchProps {
    name?: string;
    className?: string;
    style?: React.CSSProperties;
    on?: boolean;
    onChange?: (isOn: boolean) => void;
    disabled?: boolean;
};

interface SliderProps {
    name?: string;
    className?: string;
    style?: React.CSSProperties;
    min: number;
    max: number;
    step?: number;
    value?: number;
    onChange?: (newValue: number) => void;
};

interface PasswordProps {
    name?: string;
    className?: string;
    style?: React.CSSProperties;
    placeholder?: string;
};

interface UploaderProps {
    name?: string;
    accept?: string;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;

    customUpload?: (file: File) => void;
};

interface DatePickerProps {
    name?: string;
    className?: string;
    style?: React.CSSProperties;
    placeholder?: string;
    disabled?: boolean;

    mode?: 'datetime' | 'date' | 'time' | ('year' | 'month' | 'time')[];
    value?: string;
    onChange?: (newValue: string) => void;
}

export const Input = (props: InputProps) => {
    const { disabled, name, addon, className, style, placeholder, autoComplete, onChange } = props;
    const [value, setValue] = React.useState<string>(props.value || '');

    React.useEffect(() => setValue(props.value || ''), [props.value]);

    const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setValue(ev.target.value);
        if (onChange) onChange(ev.target.value);
    };

    return (
        <div {...makeClass('input', addon && 'input-has-addon', className)} style={style}>
            <input name={name} disabled={disabled} autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={handleChange} />
            {addon}
        </div>
    );
};

Input.Checkbox = (props: CheckBoxProps) => {
    const { name, label, value, onChange, disabled, className, style } = props;
    const [checked, setChecked] = React.useState<boolean>(props.checked || false);

    React.useEffect(() => setChecked(props.checked || false), [props.checked]);

    const handleClick = () => {
        if (!disabled) {
            let newValue = !checked;
            setChecked(newValue);
            if (onChange) onChange(newValue);
        }
    };

    return (
        <div {...makeClass('checkbox', disabled && 'disabled', checked && 'checked', className)} style={style} onClick={handleClick}>
            <input type='checkbox' name={name} value={value} checked={checked} onChange={() => null} hidden />
            <Icon style={{ fontSize: '1.2em' }} type={checked ? 'check-square-fill' : 'border'} className={`mr-1 ${checked ? 'fg-success' : 'fg-darker'}`} /><span>{label}</span>
        </div>
    );
};

Input.Radio = (props: RadioProps) => {
    const { name, options, onChange, className, style } = props;
    const [value, setValue] = React.useState<string>(props.value);

    React.useEffect(() => setValue(props.value), [props.value]);

    const handleClick = (opt: RadioOption) => {
        if (!opt.disabled) {
            setValue(opt.value);
            if (onChange) onChange(opt.value);
        }
    };

    return (
        <div className={className} style={style}>
            {options.map((opt, idx) => {
                return (
                    <div key={idx} {...makeClass('radio', opt.disabled && 'disabled', value == opt.value && 'checked')} onClick={() => handleClick(opt)}>
                        <input name={name} type='radio' value={opt.value} checked={opt.value == value} onChange={() => null} hidden={true} />
                        <i /><span>{opt.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

Input.Switch = (props: SwitchProps) => {
    const { name, className, style, on, onChange, disabled } = props;
    const [toggled, setToggled] = React.useState<boolean>(on || false);

    React.useEffect(() => setToggled(props.on || false), [props.on]);

    const handleClick = () => {
        if (!disabled) {
            let newValue = !toggled;
            setToggled(newValue);
            if (onChange) onChange(newValue);
        }
    };

    return (
        <div {...makeClass('switch', !toggled && 'switch-off', disabled && 'switch-disabled', className)} style={style} onClick={handleClick}>
            <input type='checkbox' name={name} value='on' checked={toggled} onChange={() => null} hidden />

            {toggled ? [
                <div key='indicator' className='switch-indicator' />,
                <span key='status' className='switch-status'>ON</span>
            ] : [
                <span key='status' className='switch-status'>OFF</span>,
                <div key='indicator' className='switch-indicator' />
            ]}
        </div>
    );
};

Input.Slider = (props: SliderProps) => {
    const { name, className, style, min, max, step, onChange } = props;
    const [amount, setAmount] = React.useState<number>(props.value || min);
    const [dragging, setDragging] = React.useState<boolean>(false);
    const sliderRef = React.useRef<HTMLDivElement>(null);
    const progress = 100 - (amount - min) * 100 / (max - min);

    React.useEffect(() => setAmount(props.value || min), [props.value]);

    const setAmountByPercent = (percent: number) => {
        if (percent < 0) percent = 0;
        if (percent > 1) percent = 1;

        let newAmount = (max - min) * percent + min;
        if (step) {
            newAmount = Math.floor(newAmount / step) * step;
        }

        setAmount(newAmount);
        if (onChange) onChange(newAmount);
    };

    const handleMouseDown = (ev: React.MouseEvent<HTMLDivElement>) => {
        let coords = sliderRef.current.getBoundingClientRect();
        let percent = (ev.clientX - coords.left) / coords.width;
        setDragging(true);
        setAmountByPercent(percent);
    };

    const handleMouseMove = (ev: React.MouseEvent<HTMLDivElement>) => {
        if (dragging) {
            let coords = sliderRef.current.getBoundingClientRect();
            let percent = (ev.clientX - coords.left) / coords.width;
            setAmountByPercent(percent);
        }
    };

    const handleMouseUp = () => {
        setDragging(false);
    };

    const handleMouseLeave = () => {
        setDragging(false);
    };

    return (
        <div {...makeClass('slider', className)} style={style} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}>
            <input name={name} type='text' value={amount} onChange={() => null} hidden />
            <div ref={sliderRef} className='slider-bar'>
                <div className='slider-value select-none pointer' style={{ right: `${progress}%` }}>{amount}</div>
                <div className='slider-progress' style={{ right: `${progress}%` }} />
                <div className='slider-handle' style={{ right: `${progress}%` }} />
            </div>
        </div>
    );
};

Input.Password = (props: PasswordProps) => {
    const { name, className, style, placeholder } = props;
    const [show, setShow] = React.useState<boolean>(false);
    const [value, setValue] = React.useState<string>('');

    return (
        <div {...makeClass('password', className)} style={style}>
            <div className='input-area'>
                <input type={show ? 'text' : 'password'} width='100%' name={name} placeholder={placeholder} value={value} onChange={ev => setValue(ev.target.value)} />
            </div>
            <Icon type={show ? `eye-fill` : `eye-close-fill`} style={{ color: show ? '#909090' : '#e2e2e2' }} onClick={() => setShow(!show)} />
        </div>
    );
};

// 重构 select 控件用以解决 fireFox 兼容问题
Input.CommonSelect = (props: SelectProps) => {
    const { className, style, value, onChange, options = [], ...nativeProps } = props;
    const [selected, setSelected] = React.useState<{label: number | string, value: number | string}>({label: '', value});
    const [ifShowOptions, setIfShowOptions] = React.useState<boolean>(false);

    const handleChange = (options: {label: number | string, value: number | string}) => {
        setIfShowOptions(false);
        setSelected(options)
        if (onChange) onChange(options.value);
    };

    React.useEffect(() => {
        const currentOption = options.find(option => option.value === value);
        if (typeof currentOption != 'undefined') {
            setSelected(currentOption);
        }
        else {
            setSelected({label: '', value});
        }
    }, [value]);

    return (
        <div>
            <input defaultValue={selected.value} {...nativeProps} style={{display: 'none'}}/>
            <div {...makeClass('select', className)} style={style}>
                <div className="select-container" onClick={() => setIfShowOptions(prev => !prev)}>
                    <span>{selected.label}</span>
                    <Icon className='mr-1' type='down' />
                </div>
                <div className="select-list" style={ifShowOptions ? {} : {display: 'none'}}>
                    {
                        options.length == 0 ? <div className="select-item"><Empty label={'暂无选项'}/></div>
                        : options.map(option =>
                            <div
                                key={option.value}
                                className="select-item"
                                onClick={() => { handleChange(option) }}
                                style={selected.value == option.value ? {background: '#e6f7ff'} : {}}
                            >{option.label}</div>)
                    }
                </div>
            </div>
        </div>
    )
};

Input.Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => {
    const { className, style, value, onChange, children, ...nativeProps } = props;
    const [selected, setSelected] = React.useState<string | number | string[]>(value as string | number | string[]);

    const handleChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        setSelected(ev.target.value);
        if (onChange) onChange(ev);
    };

    React.useEffect(() => setSelected(props.value as string | number | string[]), [props.value]);

    return (
        <div {...makeClass('select', className)} style={style}>
            <select value={selected} onChange={handleChange} {...nativeProps}>
                {children}
            </select>
        </div>
    )
};

Input.Textarea = React.forwardRef((props: React.TextareaHTMLAttributes<HTMLTextAreaElement>, ref: React.RefObject<HTMLTextAreaElement>) => {
    const { className, style, value, onChange, ...nativeProps } = props;
    const [content, setContent] = React.useState<string>(value as string);

    const handleChange = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(ev.target.value);
        if (onChange) onChange(ev);
    };

    React.useEffect(() => setContent(props.value as string), [props.value]);

    return (
        <div {...makeClass('input', className)} style={style}>
            <textarea ref={ref} value={content} onChange={handleChange} {...nativeProps} />
        </div>
    );
});

Input.Uploader = (props: UploaderProps) => {
    const { name, accept, className, style, children, customUpload } = props;
    const [uploaded, setUploaded] = React.useState<{ itemId: string; node: React.ReactNode }[]>([]);

    const Item = (props: { itemId: string }) => {
        const [autoClicked, setAutoClicked] = React.useState<boolean>(false);
        const [valid, setValid] = React.useState<boolean>(false);
        const [fileName, setFileName] = React.useState<string>('');

        const removeSelf = () => {
            setUploaded(prev => {
                let ret = prev.slice();
                let idx = ret.findIndex(v => v.itemId == props.itemId);
                ret.splice(idx, 1);
                return ret;
            });
        };

        const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
            if (ev.target.files.length == 0) {
                removeSelf();
            } else {
                setFileName(ev.target.files[0].name);
                setValid(true);
            }
        }

        const autoClick = (node: HTMLInputElement) => {
            if (!autoClicked && node) {
                setAutoClicked(true);
                node.click();
            }
        }

        return (
            <div className='uploader-item' hidden={!valid}>
                <input ref={autoClick} type='file' name={name} accept={accept} onChange={handleChange} hidden />
                <span>{fileName}</span>
                <Icon type='close' className='ml-2' onClick={removeSelf} />
            </div>
        );
    };

    const handleClick = (ev: React.MouseEvent<HTMLDivElement>) => {
        ev.preventDefault();

        if (customUpload) {
            const input = document.createElement('input');
            input.name = name;
            input.type = 'file';
            input.accept = accept || '*/*';
            input.hidden = true;
            input.addEventListener('change', () => {
                if (input.files.length > 0) customUpload(input.files[0]);
                input.remove();
            });
            document.body.appendChild(input);
            input.click();
        } else {
            let itemId = makeId();
            setUploaded([...uploaded, { itemId: itemId, node: <Item itemId={itemId} key={itemId} /> }]);
        }
    };

    return (
        <div {...makeClass('uploader', className)} style={style}>
            <div onClick={handleClick}>
                {children}
            </div>
            {uploaded.length > 0 && <div className='uploader-list'>{uploaded.map(v => v.node)}</div>}
        </div>
    );
};

Input.DatePicker = (props: DatePickerProps) => {
    const { name, className, style, placeholder, disabled, mode, onChange, value } = props;
    const [selfValue, setSelfValue] = React.useState<string>(value || '');
    const [popup, setPopup] = React.useState<boolean>(false);

    React.useEffect(() => {
        value !== selfValue && setSelfValue(value);
    }, [value])

    const handleChange = (date: string) => {
        setSelfValue(date);
        setPopup(false);
        if (onChange) onChange(date);
    };

    return (
        <div {...makeClass('input', className)} style={{ ...style }}>
            <input
                name={name}
                autoComplete='off'
                disabled={disabled}
                placeholder={placeholder}
                value={selfValue || ''}
                onChange={() => null}
                onFocus={() => { !popup && setPopup(true); }}
            />
            <div className='anchor' hidden={!popup}>
                <DateTime mode={mode} value={selfValue || ''} onChange={handleChange} />
            </div>
        </div>
    );
};
