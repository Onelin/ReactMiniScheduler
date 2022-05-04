
// import {
//   unstable_IdlePriority as IdlePriority,
//   unstable_ImmediatePriority as ImmediatePriority,
//   unstable_LowPriority as LowPriority,
//   unstable_NormalPriority as NormalPriority,
//   unstable_UserBlockingPriority as UserBlockingPriority,
//   unstable_getFirstCallbackNode as getFirstCallbackNode,
//   unstable_scheduleCallback as scheduleCallback,
//   unstable_shouldYield as shouldYield,
//   unstable_cancelCallback as cancelCallback,
//   CallbackNode
// } from 'scheduler'

import {
  unstable_LowPriority as LowPriority,
  unstable_IdlePriority as IdlePriority,
  unstable_ImmediatePriority as ImmediatePriority,
  unstable_NormalPriority as NormalPriority,
  unstable_UserBlockingPriority as UserBlockingPriority,
  unstable_getFirstCallbackNode as getFirstCallbackNode,
  unstable_cancelCallback as cancelCallback,
  unstable_scheduleCallback as scheduleCallback,
  unstable_shouldYield as shouldYield,
  CallbackNode
} from 'scheduler';

import './style.css'

type Priority = | IdlePriority | NormalPriority | ImmediatePriority | LowPriority | UserblockingPriority;


interface Work {
  count: number;
  priority: Priority;
}

const priority2UseList: Priority[] = [
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  // IdlePriority
]

const priorityBtnNames = [
  'noon',
  'ImmediatePriority',
  'UserBlockingPriority',
  'NormalPriority',
  'LowPriority',
  'IdlePriority'
]

//当前任务优先级
let prePriority: Priority = IdlePriority
let currentCallBack: CallbackNode | null

const workList: Work[] = []

const root = document.querySelector('#root')
const contentBox = document.querySelector('#content')

//创建按钮
priority2UseList.forEach((priority => {
  const btn = document.createElement('button')
  console.log(priority)
  btn.innerHTML = priorityBtnNames[priority]
  root?.appendChild(btn)
  btn.onclick = () => {
    workList.push({
      priority,
      count: 100
    })
    schedule()
  }
}))

//插入任务
const insertItem = (priority: number) => {
  const ele = document.createElement('span')
  ele.innerHTML = `${priority}`
  ele.className = `pri-${priority}`
  sleep(3000000)
  contentBox?.appendChild(ele)
}

//调度流程
function schedule () {
  //查看当前是否有正在执行的任务
  const cbNode = getFirstCallbackNode()
  //从任务队列取出优先级最高
  const curTask = workList.sort((s1, s2) => s1.priority - s2.priority)[0]
  console.log('workList', workList);
  console.log('curTask', curTask);
  
  //没有优先级更高的, 重置状态和 取消正在执行的任务(理论上是没有的)
  if (!curTask) {
    currentCallBack = null
    cbNode && cancelCallback(cbNode)
    return
  }

  //从当前任务取优先级
  const { priority: curPriority } = curTask
  console.log('curPriority', curPriority);

  //如果优先级相等  不再调度
  if (prePriority === curPriority) {
    return
  }

  //执行当前优先级最高的任务
  currentCallBack = scheduleCallback( curPriority, perform.bind(null, curTask))
}

const sleep = function(len) {
  let result = 0
  while (len--) {
    result += len
  }
}

//执行流程
function perform(work: Work, didTimeout?: boolean) {
  //判断优先级
  //1.是否同步任务  2.时间切片用尽
  const isSync = work.priority === ImmediatePriority || didTimeout
  //需要同步执行
  while ((isSync || !shouldYield()) && work.count) {
    work.count--
    //执行任务
    insertItem(work.priority)
  }
  //走到这 说明上个任务执行完了 或者 来新任务了   记录任务优先级
  prePriority = work.priority

  //如果任务执行完
  if (!work.count) {
    //找到当前任务下标
    const index = workList.indexOf(work)
    //删除任务
    workList.splice(index, 1)
    //重置优先级
    prePriority = IdlePriority
  }

  //记录调度前的任务
  const preCallback = currentCallBack

  schedule()

  //记录调度后的任务
  const newCallback = currentCallBack

  //如果有变化 说明来新活儿了
  if (newCallback && preCallback === newCallback) {
    //没有变化 代表同一个 work, 只不过时间切片用尽
    //返回的函数会接着被 scheduler 调用
    return perform.bind(null, work)
  }
}

