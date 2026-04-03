import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import RequirementInput from '../views/RequirementInput.vue'
import Brainstorming from '../views/Brainstorming.vue'
import WritePRD from '../views/WritePRD.vue'
import WritingPlans from '../views/WritingPlans.vue'
import ABTest from '../views/ABTest.vue'
import Analytics from '../views/Analytics.vue'
import Onboarding from '../views/Onboarding.vue'
import Summary from '../views/Summary.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/requirement',
    name: 'Requirement',
    component: RequirementInput
  },
  {
    path: '/brainstorming',
    name: 'Brainstorming',
    component: Brainstorming
  },
  {
    path: '/write-prd',
    name: 'WritePRD',
    component: WritePRD
  },
  {
    path: '/writing-plans',
    name: 'WritingPlans',
    component: WritingPlans
  },
  {
    path: '/ab-test',
    name: 'ABTest',
    component: ABTest
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: Analytics
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: Onboarding
  },
  {
    path: '/summary',
    name: 'Summary',
    component: Summary
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

export default router
