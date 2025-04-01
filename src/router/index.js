import { createRouter, createWebHistory } from 'vue-router'
import CaseList from '../views/CaseList.vue'
import CaseEdit from '../views/CaseEdit.vue'
import FunctionEdit from '../views/FunctionEdit.vue'
import HookEdit from '../views/HookEdit.vue'
import FunctionList from '../views/FunctionList.vue'
import Dashboard from '../views/Dashboard.vue'
import Settings from '../views/Settings.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/cases',
      name: 'caseList',
      component: CaseList
    },
    {
      path: '/case/new',
      name: 'caseNew',
      component: CaseEdit
    },
    {
      path: '/case/:caseId',
      name: 'caseEdit',
      component: CaseEdit
    },
    {
      path: '/case/:caseId/function/:functionName',
      name: 'functionEdit',
      component: FunctionEdit
    },
    {
      path: '/case/:caseId/hooks/:hookName',
      name: 'hookEdit',
      component: HookEdit
    },
    {
      path: '/case/:caseId/hooks/:hookName/:type',
      name: 'hookEditWithType',
      component: HookEdit
    },
    {
      path: '/functions',
      name: 'functionList',
      component: FunctionList
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings
    }
  ]
})

export default router