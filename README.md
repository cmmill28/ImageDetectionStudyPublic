# Image Detection Study App

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Contribution](#contribution)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Overview

This is a web-based application designed for a study involving decision support systems (DSS) and image detection tasks. The project includes practice questions, baseline questions, confidence assessments, assistance selection, assisted questions, final questions, a survey, and debriefing. It logs data using MongoDB and is built with Node.js, Express.js, and Twig templating engine.

## Features

- Randomized display of decision support options
- Confidence assessment after practice and assisted rounds
- Logging of user activities and responses
- Support for multiple users simultaneously
- Dynamic question and image sets
- Detailed session management for each user

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/cmmill28/ImageDetectionStudy.git
    cd DHSProject
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up the MongoDB database:

    - Ensure MongoDB is installed and running.
    - Update the MongoDB URI in the `.env` file.

4. Start the application:

    ```bash
    npm start
    ```

## Usage

1. Open your web browser and navigate to `http://localhost:3000`.
2. Follow the on-screen instructions to participate in the study.


## Contribution

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Special thanks to the original creator, Ryan Kemmer, for providing the base code.


