import { create } from "../lib/main";
import { createScheduler } from "../lib/addons/scheduler";
import Parent from "./Parent";

document.addEventListener("DOMContentLoaded", () => {
  const app = create({
    scheduler: createScheduler(),
  });

  const refParent = document.getElementById("parent");

  if (refParent) {
    const createParent = app.component(Parent);

    const a = createParent(refParent); // void

    setTimeout(() => {
      app.unmount([refParent]);
    }, 5000);
  }
});
