var timerInterval;

function startTimer(duration, display, userID, questionNumber) {
    clearInterval(timerInterval);
    var timer = duration, minutes, seconds;
    timerInterval = setInterval(function () {
        if (--timer < 0) {
            clearInterval(timerInterval);
            hideImage();
            display.textContent = "00:00";
        } else {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            display.textContent = minutes + ":" + seconds;
        }
    }, 1000);
}

function hideImage() {
    document.getElementById('img2find').style.visibility = 'hidden';
    document.getElementById('timeup-message').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function() {
    var duration = 30; // 30 seconds
    var display = document.querySelector('#time');
    var userID = document.querySelector('#userID').innerText.split(':')[1].trim();
    var questionNumber = document.querySelector('#questionNumber').value;

    startTimer(duration, display, userID, questionNumber);

    document.getElementById('subForm').onsubmit = function(event) {
        var timeLeft = document.getElementById("time").innerHTML;
        var secondsLeft = parseInt(timeLeft.split(':')[1]);
        var timeExpired = (secondsLeft === 0);

        var timeTaken = 30 - secondsLeft;
        document.getElementById('timeTaken').value = timeTaken;

        if (!document.querySelector('input[name="answer"]:checked')) {
            event.preventDefault();
            alert('Please select an option before submitting.');
            return false;
        }

        const formData = {
            userID: userID,
            questionNumber: questionNumber,
            timeTaken: timeTaken,
            timeExpired: timeExpired,
            answer: document.querySelector('input[name="answer"]:checked').value
        };

        fetch(`/activity/${userID}/assisted_round`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.text())
        .then(html => {
            document.open();
            document.write(html);
            document.close();
        })
        .catch(error => console.error('Error:', error));

        return false; // Prevent default form submission
    };
});
