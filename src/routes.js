import Login from './login';
import Home from './home';

const routes = [
    {
        path: "/login",
        component: Login,
    },
    {
        path: "/",
        component: Home,
    }
];

export default routes;