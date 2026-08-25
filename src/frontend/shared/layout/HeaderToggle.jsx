import React, { useContext, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "@/app/AuthProvider";
import { authActions } from "@/features/auth/state/authSlice";
import { cn } from "@/shared/lib/utils";
import { isNavigationItemActive } from "./navigation";
import Button from "@/shared/ui/Button";

const HeaderToggle = ({ show, handleClose, handleShow, items }) => {
	const dispatch = useDispatch(); const navigate = useNavigate(); const { pathname } = useLocation(); const { auth } = useContext(AuthContext); const { user, isAuthenticated } = auth.current;
	const drawerRef = useRef(null); const closeButtonRef = useRef(null); const restoreFocusRef = useRef(null);
	useEffect(() => {
		if (!show || typeof document === "undefined") return undefined;
		restoreFocusRef.current = document.activeElement; const previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
		const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
		const handleKeyDown = (event) => { if (event.key === "Escape") { event.preventDefault(); handleClose(); return; } if (event.key !== "Tab") return; const focusable = drawerRef.current?.querySelectorAll(selector); if (!focusable?.length) return; const first = focusable[0]; const last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } };
		document.addEventListener("keydown", handleKeyDown); const frameId = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
		return () => { window.cancelAnimationFrame(frameId); document.removeEventListener("keydown", handleKeyDown); document.body.style.overflow = previousOverflow; if (restoreFocusRef.current instanceof HTMLElement) restoreFocusRef.current.focus(); };
	}, [handleClose, show]);
	const handleNavigate = (href) => { navigate(href); handleClose(); };
	const itemClass = (active = false) => cn("flex min-h-12 w-full items-center rounded-xl px-3 py-2 text-left text-base font-bold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active && "bg-accent text-accent-foreground");
	return <div className="ml-auto lg:hidden"><Button variant="outline" size="icon" className="size-11 rounded-xl" aria-label="Open navigation menu" aria-expanded={show} aria-controls="mobile-navigation" onClick={handleShow}><Menu className="size-5" /></Button>{show && <div className="fixed inset-0 z-50" role="presentation"><button type="button" aria-label="Close navigation menu" tabIndex={-1} className="absolute inset-0 bg-black/40" onClick={handleClose} /><aside id="mobile-navigation" ref={drawerRef} className="absolute inset-y-0 right-0 w-[min(22rem,90vw)] overflow-y-auto bg-card p-5 shadow-2xl" role="dialog" aria-modal="true" aria-label="Mobile navigation"><div className="flex items-start justify-between gap-4 border-b border-border pb-5"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Food Recipes</p><strong className="mt-1 block text-lg">{isAuthenticated ? `Welcome ${user?.full_name || "back"}` : "Welcome"}</strong></div><Button ref={closeButtonRef} variant="ghost" size="icon" aria-label="Close navigation menu" onClick={handleClose}><X className="size-5" /></Button></div><nav className="mt-4" aria-label="Mobile primary navigation"><ul className="grid gap-1">{items.map(({ title, href }) => { const active = isNavigationItemActive(pathname, href, items); return <li key={href}><Link className={itemClass(active)} aria-current={active ? "page" : undefined} to={href} onClick={handleClose}>{title}</Link></li>; })}<li className="mt-3 border-t border-border pt-3">{isAuthenticated ? <button type="button" className={itemClass()} onClick={() => { dispatch(authActions.logout()); handleNavigate("/"); }}>Sign out</button> : <button type="button" className={itemClass()} onClick={() => handleNavigate("/account?signup=false")}>Login / Sign up</button>}</li></ul></nav></aside></div>}</div>;
};
export default HeaderToggle;
