document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            <ul class="participant-list"></ul>
          </div>
        `;

        const participantList = activityCard.querySelector(".participant-list");
        if (details.participants.length === 0) {
          const emptyState = document.createElement("li");
          emptyState.className = "empty-participants";
          emptyState.textContent = "No participants yet";
          participantList.appendChild(emptyState);
        } else {
          details.participants.forEach((email) => {
            const participant = document.createElement("li");

            const participantEmail = document.createElement("span");
            participantEmail.textContent = email;
            participant.appendChild(participantEmail);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "participant-delete";
            deleteButton.textContent = "×";
            deleteButton.setAttribute("aria-label", `Unregister ${email}`);
            deleteButton.dataset.activityName = name;
            deleteButton.dataset.email = email;
            participant.appendChild(deleteButton);

            participantList.appendChild(participant);
          });
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const deleteButton = event.target.closest(".participant-delete");
    if (!deleteButton) {
      return;
    }

    deleteButton.disabled = true;
    const activityName = deleteButton.dataset.activityName;
    const email = deleteButton.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Unable to unregister participant.";
        messageDiv.className = "error";
        deleteButton.disabled = false;
      }

      messageDiv.classList.remove("hidden");
    } catch (error) {
      messageDiv.textContent = "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      deleteButton.disabled = false;
      console.error("Error unregistering participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
