const textarea = document.getElementById("feature-request");
const charCount = document.getElementById("char-counter");
const ratingItems = document.querySelectorAll(".rating-item");
const snoozeButton = document.getElementById("snooze-btn");
const submitButton = document.getElementById("submit-btn");
const loader = document.getElementById("loader");
let selectedRating = -1;
let feedbackText = "";
let maxAllowedSnoozeCount = 5;
let snoozeCount = 0;
let platform = "";
let userHash = "";

// initialize default button states
snoozeButton.classList.add("hidden");
submitButton.classList.add("disabled");

// method to pass event to mobile apps
function onAction(action) {
  let message = "";
  if (action == "snooze") {
    message = "Feedback prompt snoozed for a day";
  } else if (action == "submit-success") {
    message = "Thank you for your feedback!";
  } else if (action == "submit-error") {
    message = "Failed to submit feedback";
  }
  let payload = {
    action: action,
    message: message,
  };
  console.log(payload);
  try {
    // handle in android
    window.carousel_web_view.onAction(JSON.stringify(payload));
  } catch (error) {}
  try {
    // handle in ios
    window.webkit.messageHandlers.buttonHandler.postMessage(payload);
  } catch (error) {}
}

// method to get initial setup values from mobile apps
function setupData(mSnoozeCount, mPlatform, mUserHash) {
  // handle snooze count
  let tempSnoozeCount = parseInt(mSnoozeCount);
  if (!isNaN(tempSnoozeCount)) {
    snoozeCount = tempSnoozeCount;
    updateSnoozeButtonState();
  }
  // handle platform
  if (typeof mPlatform === "string") {
    let tempPlatform = mPlatform.toLowerCase();
    if (tempPlatform == "ios") {
      platform = "iOS";
    } else if (tempPlatform == "android") {
      platform = "Android";
    } else {
      platform = navigator.userAgent;
    }
  }
  // handle user hash
  if (typeof mUserHash === "string" && mUserHash != "") {
    userHash = mUserHash;
  }
}

function updateSnoozeButtonState() {
  if (snoozeCount >= maxAllowedSnoozeCount) {
    snoozeButton.classList.add("hidden");
  } else {
    snoozeButton.classList.remove("hidden");
  }
}

function updateSubmitButtonState() {
  if (feedbackText.trim() == "" || selectedRating == -1) {
    submitButton.classList.add("disabled");
  } else {
    submitButton.classList.remove("disabled");
  }
}

function submitFeedback() {
  //show loader
  loader.classList.remove("hidden");
  snoozeButton.classList.add("disabled");
  submitButton.classList.add("disabled");

  // pass event to mobile apps
  onAction("submit");

  const options = {
    method: "POST",
    headers: {
      loginpass: userHash,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      platform: platform,
      rating: selectedRating,
      feedback: feedbackText,
      additionalInfo: { source: "may_2025_feedback" },
    }),
  };

  fetch("https://jsonplaceholder.typicode.com/todos/1")
    .then((response) => response.json())
    .then((data) => {
      if (data.id == "1") {
        onAction("submit-success");
      } else {
        onAction("submit-error");
      }
    })
    .catch((err) => onAction("submit-error"))
    .finally(() => {
      //hide loader
      loader.classList.add("hidden");
      snoozeButton.classList.remove("disabled");
      submitButton.classList.remove("disabled");
    });
}

// add input event listener to textarea
textarea.addEventListener("input", function () {
  charCount.textContent = textarea.value.length + "/500";
  feedbackText = textarea.value;
  updateSubmitButtonState();
});

// add click event listener to rating items
ratingItems.forEach((item) => {
  item.addEventListener("click", function () {
    let rating = parseInt(item.textContent);
    console.log(item.textContent, rating);
    ratingItems.forEach((mItem) => {
      let mRating = parseInt(mItem.textContent);
      if (mRating <= rating) {
        mItem.classList.add("selected");
      } else {
        mItem.classList.remove("selected");
      }
    });
    selectedRating = rating;
    updateSubmitButtonState();
  });
});
