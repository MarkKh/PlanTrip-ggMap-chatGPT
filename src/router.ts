import { createRouter, createWebHistory } from "vue-router";
import Landing from "./components/Landing.vue";
import Test from "./components/test.vue";

const routes = [
  {
    path: "/",
    name: "Landing",
    component: Landing,
  },
  {
    path: "/test/:id",
    name: "test",
    component: Test,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
