import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { Header } from "../components/Header";
import { url } from "../const";
import "./home.scss";

export const Home = () => {
    const [isDoneDisplay, setIsDoneDisplay] = useState("todo"); // todo->未完了 done->完了
    const [lists, setLists] = useState([]);
    const [selectListId, setSelectListId] = useState();
    const [tasks, setTasks] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [cookies] = useCookies();
    const [nowTime, setNowTime] = useState(new Date());
    const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);

    useEffect(() => {
        axios
            .get(`${url}/lists`, {
                headers: {
                    authorization: `Bearer ${cookies.token}`,
                },
            })
            .then((res) => {
                setLists(res.data);
            })
            .catch((err) => {
                setErrorMessage(`リストの取得に失敗しました。${err}`);
            });
    }, [cookies.token]);

    useEffect(() => {
        const listId = lists[0]?.id;
        if (typeof listId !== "undefined") {
            setSelectListId(listId);
            axios
                .get(`${url}/lists/${listId}/tasks`, {
                    headers: {
                        authorization: `Bearer ${cookies.token}`,
                    },
                })
                .then((res) => {
                    setTasks(res.data.tasks);
                })
                .catch((err) => {
                    setErrorMessage(`タスクの取得に失敗しました。${err}`);
                });
        }
    }, [lists, cookies.token]);

    useEffect(() => {
        const interval = setInterval(() => {
            setNowTime(new Date());
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleSelectList = (id) => {
        setSelectListId(id);
        axios
            .get(`${url}/lists/${id}/tasks`, {
                headers: {
                    authorization: `Bearer ${cookies.token}`,
                },
            })
            .then((res) => {
                setTasks(res.data.tasks);
            })
            .catch((err) => {
                setErrorMessage(`タスクの取得に失敗しました。${err}`);
            });
    };
    return (
        <div>
            <Header />
            <main className="taskList">
                <p className="error-message">{errorMessage}</p>
                <div>
                    <div className="list-header">
                        <h2>リスト一覧</h2>
                        <div className="list-menu">
                            <p>
                                <Link to="/list/new">リスト新規作成</Link>
                            </p>
                            <p>
                                <Link to={`/lists/${selectListId}/edit`}>
                                    選択中のリストを編集
                                </Link>
                            </p>
                        </div>
                    </div>
                    <ul className="list-tab" role="tablist">
                        {lists.map((list, key) => {
                            const isActive = list.id === selectListId;
                            return (
                                <li
                                    key={key}
                                    className={`list-tab-item ${
                                        isActive ? "active" : ""
                                    }`}
                                    role="tab"
                                    tabIndex={0}
                                    onKeyDown={() => handleSelectList(list.id)}
                                    onClick={() => handleSelectList(list.id)}
                                >
                                    {list.title}
                                </li>
                            );
                        })}
                    </ul>
                    <div className="tasks">
                        <div className="tasks-header">
                            <h2>タスク一覧</h2>
                            <Link to="/task/new">タスク新規作成</Link>
                        </div>
                        <div className="display-select-wrapper">
                            <select
                                onChange={handleIsDoneDisplayChange}
                                className="display-select"
                            >
                                <option value="todo">未完了</option>
                                <option value="done">完了</option>
                            </select>
                        </div>
                        <Tasks
                            tasks={tasks}
                            selectListId={selectListId}
                            isDoneDisplay={isDoneDisplay}
                            nowTime={nowTime}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

// 表示するタスク
const Tasks = (props) => {
    const { tasks, selectListId, isDoneDisplay, nowTime } = props;

    if (tasks === null) return <></>;

    if (isDoneDisplay === "done") {
        return (
            <ul>
                {tasks
                    .filter((task) => {
                        return task.done === true;
                    })
                    .map((task, key) => (
                        <li key={key} className="task-item">
                            <Link
                                to={`/lists/${selectListId}/tasks/${task.id}`}
                                className="task-item-link"
                            >
                                {task.title}
                                <br />
                                {task.done ? "完了" : "未完了"}
                            </Link>
                        </li>
                    ))}
            </ul>
        );
    }

    return (
        <ul>
            {tasks
                .filter((task) => {
                    return task.done === false;
                })
                .map((task, key) => {
                    return (
                        <li key={key} className="task-item">
                            <Link
                                to={`/lists/${selectListId}/tasks/${task.id}`}
                                className="task-item-link"
                            >
                                {task.title}
                                <br />
                                期限日時:{task.limit}
                                <br />
                                残り日時:{calcReaminTime(nowTime, task.limit)}
                                <br />
                                {task.done ? "完了" : "未完了"}
                            </Link>
                        </li>
                    );
                })}
        </ul>
    );
};

const calcReaminTime = (nowTime, limit) => {
    // 残り日時の計算
    const deadlineDate = new Date(limit); //締め切り
    const diff = deadlineDate.getTime() - nowTime.getTime(); //差
    if (diff < 0) {
        return "期限です";
    }
    const day = Math.floor(diff / (1000 * 60 * 60 * 24));
    //日本標準時で計算すると9時間足される
    const hours =
        Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) - 9;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${day}日 ${hours}時間 ${minutes}分 ${seconds}秒`;
};
