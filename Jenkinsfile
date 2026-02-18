pipeline {
    agent { label 'agent-vinod' }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('docker-hub_creds')
    }

    stages {

        stage('Build Backend Image') {
            steps {
                sh """
                docker build -t ${DOCKERHUB_CREDENTIALS_USR}/shadowcanvas-backend ./backend
                """
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh """
                docker build -t ${DOCKERHUB_CREDENTIALS_USR}/shadowcanvas-frontend ./frontend
                """
            }
        }

        stage('Docker Login & Push') {
            steps {
                sh """
                echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin
                docker push ${DOCKERHUB_CREDENTIALS_USR}/shadowcanvas-backend
                docker push ${DOCKERHUB_CREDENTIALS_USR}/shadowcanvas-frontend
                """
            }
        }
    }
}
