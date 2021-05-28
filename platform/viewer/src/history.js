import { createBrowserHistory, createHashHistory } from 'history';
const useHashRouting = JSON.parse(process.env.USE_HASH_ROUTER);
const router = useHashRouting ? createHashHistory() : createBrowserHistory();

export default router;
