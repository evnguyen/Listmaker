import { useAuth0 } from "@auth0/auth0-react";
import Button from '@mui/material/Button';
import { useHistory } from "react-router-dom";

const Login = () => {
    const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
    const history = useHistory();


    if (isAuthenticated && !isLoading) {
        console.log('Went to /login, but already authenticated. Redirecting to home');
        history.push('/');
    }
    return (
        <div>
            <Button variant="contained" onClick={loginWithRedirect}>Login</Button>
        </div>
    );
};

export default Login;
