import Vue from 'vue'
import Router from 'vue-router'
import soduku from '@/components/soduku'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'soduku',
      component: soduku
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
