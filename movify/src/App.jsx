import { Route, Routes, } from "react-router";
import HomePage from "./components/HomePage";
import NavBar from './components/NavBar';
import Register from "./components/Register";
import Movies from "./components/Pages/Movies";
import Members from "./components/Pages/Members";
import ManageUsers from "./components/adminTools/ManageUsers";
import ChangePassword from "./components/ChangePassword";
import Subscriptions from "./components/Pages/Subscriptions";


const App = () => {
  return (
    <>
    <NavBar/>
    <Routes>
      <Route path='/' Component={HomePage}/>
      <Route path='/register' Component={Register}/>
      <Route path='/movies' Component={Movies}/>
      <Route path='/users' Component={ManageUsers}/>
      <Route path='/members' Component={Members}/>
      <Route path='/subscriptions' Component={Subscriptions}/>
      <Route path='/ChangePassword' Component={ChangePassword}/>
    </Routes>
    </>
  )
}

export default App