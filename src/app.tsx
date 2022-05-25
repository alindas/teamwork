import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { AliveScope } from 'react-activation';

import store from './model';
import { Install } from './pages/install';
import { Login } from './pages/login';
import { Home } from './pages/home';
import { request } from './common/request';
import './app.css';


const App = () => {
    const [page, setPage] = React.useState<JSX.Element>(null);

    React.useEffect(() => {
        request({
            url: '/home',
            success: (type: string) => {
                switch (type) {
                    case 'install':
                        setPage(<Install />);
                        break;
                    case 'home':
                        setPage(<Home />)
                        break;
                    default:
                        setPage(<Login />)
                        break;
                }
            }
        })
    }, []);

    return <div>{page}</div>
};

ReactDOM.render(
    <Provider store={store}>
        <AliveScope>
            <App />
        </AliveScope>
    </Provider>,
    document.getElementById('app')
);
