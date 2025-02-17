import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import axios from "axios";
import { url } from "../const";
import { Header } from "../components/Header";
import "./newTask.scss"
import { useNavigate } from "react-router-dom";

export const NewTask = () => {
  const [selectListId, setSelectListId] = useState();
  const [lists, setLists] = useState([]);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [subtime, setSubtime] = useState("");//残り時刻
  const [deadline, setDeadline] = useState("");//タスクの期限設定
  const [cookies] = useCookies();
  const navigate = useNavigate();
  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleDetailChange = (e) => setDetail(e.target.value);
  const handleSelectList = (id) => setSelectListId(id);
  const handleDateChange = (e) => setDeadline(e.target.value);  //選択した日付を変更

  const onCreateTask = () => {
    const data = {
      title: title,
      detail: detail,
      done: false,
      limit: `${deadline}Z`,
    };

    axios.post(`${url}/lists/${selectListId}/tasks`, data, {
        headers: {
          authorization: `Bearer ${cookies.token}`
        }
    })
    .then(() => {
      navigate("/");
    })
    .catch((err) => {
      setErrorMessage(`タスクの作成に失敗しました。${err}`);
    })
  }

  useEffect(() => {
    axios.get(`${url}/lists`, {
      headers: {
        authorization: `Bearer ${cookies.token}`
      }
    })
    .then((res) => {
      setLists(res.data)
      setSelectListId(res.data[0]?.id)
    })
    .catch((err) => {
      setErrorMessage(`リストの取得に失敗しました。${err}`);
    })
  }, [])

  useEffect(() => {
    const now = new Date();//現在時刻を取得

    const formattedDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    setDeadline(formattedDate.toISOString().slice(0, 19));//〆切に設定
  },[])

    //現在時刻から指定日時までの残り時間を計算
  useEffect(() => {
    const deadlineDate = new Date(deadline);//締め切り
    const now = new Date();//現在時刻
    const diff = deadlineDate - now;//差分

    if(diff >0) {
      const day = Math.floor((diff/(1000*60*60*24)));
      const hours = Math.floor(diff % ((1000*60*60*24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setSubtime(`${day}日 ${hours}時間 ${minutes}分 ${seconds}秒`);
    }else {
      setSubtime("その日時は設定できません");
    }
  },[deadline])

  return (
    <div>
      <Header />
      <main className="new-task">
        <h2>タスク新規作成</h2>
        <p className="error-message">{errorMessage}</p>
        <form className="new-task-form">
          <label>リスト</label><br />
          <select onChange={(e) => handleSelectList(e.target.value)} className="new-task-select-list">
            {lists.map((list, key) => (
              <option key={key} className="list-item" value={list.id}>{list.title}</option>
            ))}
          </select><br />
          <label>タイトル</label><br />
          <input type="text" onChange={handleTitleChange} className="new-task-title" /><br />
          <label>期限(UTC)</label><br />
          <input style={{width:"200px"}} onChange={handleDateChange}
            type="datetime-local"
            value={deadline} /><br />
          <p>{deadline}</p><br />
          <label>残り期限</label><br />
          <p>{subtime}</p><br />
          <label>詳細</label><br />
          <textarea type="text" onChange={handleDetailChange} className="new-task-detail" /><br />
          <button type="button" className="new-task-button" onClick={onCreateTask}>作成</button>
        </form>
      </main>
    </div>
  )
}