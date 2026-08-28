import { useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/shared/ui/Button";
import { useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation, useNotificationsQuery } from "./api/notificationsQueries";

const NotificationCenter = () => {
	const [open, setOpen] = useState(false);
	const query = useNotificationsQuery();
	const markRead = useMarkNotificationReadMutation();
	const markAll = useMarkAllNotificationsReadMutation();
	const notifications = query.data?.notifications ?? [];
	const unreadCount = notifications.filter((notification) => !notification.read_at).length;
	const label = `Notifications, ${unreadCount} unread`;

	return (
		<div className="relative shrink-0">
			<Button type="button" variant="ghost" size="icon" aria-label={label} aria-expanded={open} onClick={() => setOpen((current) => !current)}><Bell className="size-5" aria-hidden="true" />{unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.65rem] font-black text-primary-foreground" aria-hidden="true">{unreadCount > 9 ? "9+" : unreadCount}</span>}</Button>
			{open && <section className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-3 shadow-xl" aria-label="Notifications panel"><div className="flex items-center justify-between gap-3 border-b border-border pb-3"><h2 className="font-black">Notifications</h2><Button type="button" variant="ghost" size="sm" onClick={() => markAll.mutate()} disabled={unreadCount === 0 || markAll.isPending}>Mark all as read</Button></div>{query.isPending ? <p className="p-4 text-sm text-muted-foreground">Loading notifications…</p> : notifications.length === 0 ? <p className="p-4 text-sm text-muted-foreground">You’re all caught up.</p> : <ul className="max-h-80 overflow-auto">{notifications.map((notification) => <li key={notification.notification_id} className={`border-b border-border/70 py-3 last:border-b-0 ${notification.read_at ? "opacity-70" : ""}`}>{notification.action_path ? <Link to={notification.action_path} className="block rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { if (!notification.read_at) markRead.mutate(notification.notification_id); setOpen(false); }} aria-label={notification.title}><strong className="block text-sm">{notification.title}</strong>{notification.body && <span className="mt-1 block text-xs text-muted-foreground">{notification.body}</span>}</Link> : <div className="p-1"><strong className="block text-sm">{notification.title}</strong>{notification.body && <span className="mt-1 block text-xs text-muted-foreground">{notification.body}</span>}</div>}</li>)}</ul>}</section>}
		</div>
	);
};

export default NotificationCenter;
