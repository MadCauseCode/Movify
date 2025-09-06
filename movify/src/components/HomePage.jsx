import "./styles.css";
import Login from "./Login";
import { decodeJwt, isTokenValid } from "../utils/auth";
import ChangePassword from "./ChangePassword";

const HomePage = () => {
  const token = sessionStorage.getItem("access_token");
  const loggedIn = isTokenValid(token);
  const payload = loggedIn ? decodeJwt(token) : null;

  const username = payload?.fullName || payload?.username || "";
  const isAdmin = !!payload?.isAdmin;
  const isModerator = isAdmin || !!payload?.isModerator; // admin is moderator

  if (payload) {
    console.log(payload);
    console.log(token);
  }

  const handleNavClick = (e) => {
    const page = e.currentTarget.dataset.page || e.currentTarget.name;
    if (page) window.location.href = `/${page}`;
  };

  return (
    <div className="container">
      <h1 className="title">Movify</h1>
      <h2 className="subtitle">
        Movie & Subscription Service Tailored for your needs
      </h2>

      {!loggedIn ? (
        <Login />
      ) : (
        <>
          {payload.mustChangePassword && (
            <>
              <p className="warning" />
              {alert("You must change your password before proceeding.")}
              <ChangePassword />
            </>
          )}

          {!payload.mustChangePassword && (
            <>
              <p className="description">Welcome back {username}!</p>

              <div className="admin-menu">
                {isModerator && (
                  <>
                    <button
                      className="btn-login"
                      data-page="Movies"
                      onClick={handleNavClick}
                    >
                      Manage Movies
                    </button>{" "}
                    <button
                      className="btn-login"
                      data-page="subscriptions"
                      onClick={handleNavClick}
                    >
                      Manage Subscriptions
                    </button>{" "}
                  </>
                )}
                {isAdmin && (
                  <>
                    <button
                      className="btn-login"
                      data-page="register"
                      onClick={handleNavClick}
                    >
                      Create New User
                    </button>{" "}
                    <button
                      className="btn-login"
                      data-page="users"
                      onClick={handleNavClick}
                    >
                      Manage Users
                    </button>{" "}
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
