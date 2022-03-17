import User from "./User.js";
import EditableText from "./EditableText.js";
class App {
  constructor() {
    this._user = null;
    this._id = null;
    this._loginForm = null;
    this._activityForm = null;
    this._newTaskBtn = null;
    this._delAccBtn = null;
    this._activities = null;
    this._interval = null;
    this._start = null;
    this._chart = null;
    this._displayName = new EditableText("displayName");
    this._quote = new EditableText("quote");
    this._newTaskBtn = this._onNewTask.bind(this);
    this._onChangeName = this._onChangeName.bind(this);
    this._onChangeQuote = this._onChangeQuote.bind(this);
    this._onAddActivity = this._onAddActivity.bind(this);
    this._onLogin = this._onLogin.bind(this);
    this._onStart = this._onStart.bind(this);
    this._onViewAnalytics = this._onViewAnalytics.bind(this);
    this._onBackToTimer = this._onBackToTimer.bind(this);
    this._onDeleteAcc = this._onDeleteAcc.bind(this);
  }

  setup() {
    /* Setting up the home page. */
    this._loginForm = document.querySelector("#loginForm");
    this._loginForm.addEventListener("submit", this._onLogin);

    this._delAccBtn = document.querySelector("#delete-acc");
    this._delAccBtn.addEventListener("click", this._onDeleteAcc);

    let analyticsBtn = document.querySelector("#analytics-btn");
    analyticsBtn.addEventListener("click", this._onViewAnalytics);

    let backToTimerBtn = document.querySelector("#go-back");
    backToTimerBtn.addEventListener("click", this._onBackToTimer);

    this._displayName.addToDOM(
      document.querySelector("#nameContainer"),
      this._onChangeName
    );

    this._quote.addToDOM(
      document.querySelector("#quoteContainer"),
      this._onChangeQuote
    );
    /* Setting up the timer. */
    this._start = document.querySelector("#start-button");
    this._start.addEventListener("click", this._onStart);
    this._activityForm = document.querySelector("#activity-form");
    this._activityForm.addEventListener("submit", this._onAddActivity);
    this._newTaskBtn = document.querySelector("#new-task");
    this._newTaskBtn.addEventListener("click", this._onNewTask);
  }

  async _loadProfile() {
    /* Add username and quote to side bar */
    this._displayName.setValue(this._user.name);
    this._quote.setValue(this._user.quote);

    /* Displaying user home page buttons and sidebar. */
    document.querySelector("#user-info").classList.remove("hidden");
    document.querySelector("#sidebar").classList.remove("hidden");
    document
      .querySelector("#timer-container")
      .classList.add("timer-with-sidebar");
    document.querySelector("#delete-acc").classList.remove("hidden");
  }

  async _onStart(event) {
    if (this._user == null) {
      alert("Please log in.");
      return;
    }
    /* Add activity to user's activities if activity was filled out;
    otherwise, let the timer countdown without adding anything 
    to activities database. */
    let task = this._activityForm.task.value;
    if (task !== "") {
      document.querySelector("#timer-container h2").textContent = task;
      await this._user.addActivity(task);
    }
    /* User cannot delete account or start timer again while timer is in use. */
    document.querySelector("#delete-acc").classList.add("hidden");
    this._start.classList.add("hidden");
    /* Count down the time. */
    let totalMin = 25;
    let time = totalMin * 60;
    let minutes = document.querySelector("#minutes");
    let seconds = document.querySelector("#seconds");
    this._interval = setInterval(function () {
      minutes.textContent = Math.floor(time / 60);
      let secondsMath = time % 60;
      /* Prepend a 0 if seconds is single digit. */
      if (secondsMath < 10) {
        seconds.textContent = "0" + (time % 60);
      } else {
        seconds.textContent = time % 60;
      }
      time--;
      /* If time is up, stop counting down and display options on timer and
      delete acc button. */
      if (time === -1) {
        clearInterval(this._interval);
        document.querySelector("#message").textContent = "Take a break!";
        document.querySelector("#timer-container h2").textContent = "";
        this._newTaskBtn = document.querySelector("#new-task");
        this._newTaskBtn.classList.remove("hidden");
        this._start = document.querySelector("#start-button");
        this._start.classList.remove("hidden");
        document.querySelector("#delete-acc").classList.remove("hidden");
      }
    }, 1000);
  }

  async _onLogin(event) {
    event.preventDefault();
    /* Clear the timer if it was in use. */
    if (this._interval !== undefined) {
      clearInterval(this._interval);
      document.querySelector("#minutes").textContent = 25;
      document.querySelector("#seconds").textContent = "00";
      document.querySelector("#message").textContent = "Work Session";
      document.querySelector("#timer-container h2").textContent = "";
      this._newTaskBtn = document.querySelector("#new-task");
      this._newTaskBtn.classList.remove("hidden");
      this._start = document.querySelector("#start-button");
      this._start.classList.remove("hidden");
    }
    /* Load new user account. */
    this._id = this._loginForm.userid.value;
    this._user = await User.loadOrCreate(this._id);
    await this._loadProfile();
  }

  async _onChangeName(text) {
    this._user.name = text.value;
    await this._user.save();
  }

  async _onChangeQuote(text) {
    this._user.quote = text.value;
    await this._user.save();
  }

  async _onNewTask(event) {
    /* When new task button is clicked, display form to fill out activity. */
    this._newTaskBtn = document.querySelector("#new-task");
    this._newTaskBtn.classList.add("hidden");
    this._activityForm = document.querySelector("#activity-form");
    this._activityForm.classList.remove("hidden");
  }

  async _onAddActivity(event) {
    /* After form is filled out, display activity on work session status on 
    timer and reset timer to 25 minutes in the case that it was used. */
    event.preventDefault();
    let task = this._activityForm.task.value;
    if (task === "") {
      alert("Looks like you didn't fill out the activity!");
      return;
    }
    this._activityForm.classList.add("hidden");
    document.querySelector("#timer-container h2").textContent = task;
    document.querySelector("#message").textContent = "Work Session";
    document.querySelector("#minutes").textContent = 25;
  }

  async _onViewAnalytics(event) {
    /* Display analytics page. */
    document.querySelector("#login-container").classList.add("hidden");
    document.querySelector("#timer-page").classList.add("hidden");
    document.querySelector("#analytics-header").classList.remove("hidden");
    document.querySelector("#analytics-page").classList.remove("hidden");
    document.querySelector("#analytics-btn").classList.add("hidden");
    document.querySelector("footer").classList.add("hidden");
    this._activities = await this._user.getStats();
    /* If the user activities collection is empty, display no activity message. */
    if (this._activities.length !== 0) {
      document.querySelector("#no-activity-container").classList.add("hidden");
      this._displaySummary(this._activities);
    } else {
      document
        .querySelector("#no-activity-container")
        .classList.remove("hidden");
    }
  }

  _displaySummary(activities) {
    /* Create doughnut chart of user's activities. */
    let getColor = () => {
      let colors = [
        "#FFCCBB",
        "#F78D7D",
        "#CB9897",
        "#9BB9C3",
        "#947481",
        "#BB6859",
        "#C39C92",
        "#BEAFAC",
        "#BDBDBD",
        "#AAAC9F",
        "#E7CDD6",
        "#E6A7BA",
        "#EFBD9C",
        "#E29585",
        "#B7D0CD",
        "#DDBAB8",
        "#C9AEA7",
        "BD8#96",
        "#FBF4EC",
        "#A38A8D",
      ];
      let random = Math.floor(Math.random() * colors.length);
      return colors[random];
    };

    let ctx = document.querySelector("#donut-chartcanvas").getContext("2d");
    let labels = [];
    activities.forEach((activity) => labels.push(activity.activity));
    let data = [];
    activities.forEach((activity) => data.push(activity.time));
    let graph = {
      labels: labels,
      datasets: [
        {
          label: "Activity",
          data: data,
          backgroundColor: data.map((dataPt) => getColor()),
        },
      ],
    };

    let options = {
      responsive: true,
      legend: {
        display: true,
        labels: {
          fontColor: "#333",
          fontSize: 16,
        },
      },
    };

    this._chart = new Chart(ctx, {
      type: "doughnut",
      data: graph,
      options: options,
    });
  }

  async _onBackToTimer(event) {
    document.querySelector("#login-container").classList.remove("hidden");
    document.querySelector("#timer-page").classList.remove("hidden");
    document.querySelector("#analytics-page").classList.add("hidden");
    document.querySelector("#analytics-header").classList.add("hidden");
    document.querySelector("#analytics-btn").classList.remove("hidden");
    document.querySelector("footer").classList.remove("hidden");
    /* Delete chart so that it can be re-created and used upon clicking on 
    analytics button. */
    if (this._activities.length !== 0) {
      this._chart.destroy();
    }
  }

  async _onDeleteAcc(event) {
    /* Delete user and user's activities from database and show timer page before
    user login. */
    alert(
      "Are you sure you want to delete your account? All of your activity will be cleared."
    );
    this._start = document.querySelector("#start-button");
    this._start.classList.remove("hidden");
    document.querySelector("#user-info").classList.add("hidden");
    document.querySelector("#sidebar").classList.add("hidden");
    document
      .querySelector("#timer-container")
      .classList.remove("timer-with-sidebar");
    document.querySelector("footer").classList.add("hidden");
    this._loginForm.reset();
    await this._user.deleteUser(this._id);
  }
}
let app = new App();
app.setup();
