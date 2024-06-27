function initializeSurvey(userID) {
    console.log('Initializing survey for userID:', userID);
    $("#userID").text(userID);
}

function submitSurvey() {
    const surveyForm = document.getElementById('surveyForm');
    const formData = new FormData(surveyForm);
    const surveyData = Object.fromEntries(formData.entries());
    
    console.log('Survey data:', surveyData);
    
    const key = getKey();
    console.log("Generated key: ", key);

    const userID = $("#userID").text();
    const url2go = `/${userID}/sendSurvey`;
    
    console.log("URL for AJAX request:", url2go);
    
    $.ajax({
        url: url2go,
        type: "POST",
        data: { userDemographic: JSON.stringify(surveyData), key: key },
        success: function () {
            console.log("Survey data successfully posted.");
            window.location.href = `/activity/${userID}/debrief`;
        },
        error: function (xhr, status, error) {
            console.error("Error posting survey data:", status, error);
        }
    });
}

function getKey() {
    return Math.random().toString(36).substring(7);
}
