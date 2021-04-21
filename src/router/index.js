import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/home/index.vue"),
  },
  {
    path: "/shanghai",
    name: "shanghai",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/shanghai/index.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: "/jc-portal/nav/",
  routes,
});

export default router;
