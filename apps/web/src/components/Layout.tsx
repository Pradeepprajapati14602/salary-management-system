import { NavLink, Outlet } from 'react-router-dom';
import { IconChart, IconUsers } from './icons.js';

const links = [
    { to: '/', label: 'Employees', Icon: IconUsers, end: true },
    { to: '/insights', label: 'Insights', Icon: IconChart, end: false },
] as const;

export function Layout() {
    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-logo">SalaryMgmt</div>
                <nav className="sidebar-nav">
                    {links.map((l) => {
                        const NavIcon = l.Icon;
                        return (
                            <NavLink
                                key={l.to}
                                to={l.to}
                                end={l.end}
                                className={({ isActive }) =>
                                    `sidebar-link${isActive ? ' active' : ''}`
                                }
                            >
                                <span className="nav-icon" aria-hidden>
                                    <NavIcon size={18} />
                                </span>
                                {l.label}
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
