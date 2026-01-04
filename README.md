<div align="center" style="width: 100%; height: 150px;">
  <img src="assets/showcode_wm.png">
</div>

# showcode (WIP) - A better alternative for pure-code projects in your resume.

### [Cool Demo Video!](https://www.youtube.com/watch?v=DKFLb5ORMfY)

**showcode** is an ongoing project I am working on, where job-seeking users can create a better visualisation for your pure-code projects code (backend, embedded, low-level etc.). Recruiters are treated to a friendly UI to understand the underlying code rather than a bland Github repo, along with AI integration for recruiters to consult and understand every line of code.

It also comes with three main features called **Overview**, **Flow** and **Alignment**.

**Overview** is a feature where users can segregate their code based on the logical blocks of their systems. This helps recruiters understand the breakdown of the large codebase into digestable small systems of code. Recruiters can browse through each of the blocks and analyse the different code files along with using AI to provide summaries for any selected code snippets in these files.

<div style="width: 100%; height: 200px; margin: 5px;">
  <img src="assets/screens/overview-screen-1.png">
  <img src="assets/screens/overview-screen-2.png">
  <img src="assets/screens/overview-screen-3.png">
</div>

##

**Flow** is where users can create a flow chart / system design diagram to visualise the flow of the data and they can also include additional layers such as data storage, message queues etc. which are general components of the project not specific.

<div style="width: 100%; height: 200px; margin: 5px;">
  <img src="assets/screens/flow-screen-1.png">
  <img src="assets/screens/flow-screen-2.png">
</div>

##

**Alignment** is where users can pit their code against industry standards. AI analyses the code files against the current industry practices and standards and produces an "Industry Alignment Score" ranging from 0-100, 0 meaning the code is dangerous and insecure for production and 100 meaning the code is flawless and totally ready for production.

<div style="width: 100%; height: 200px; margin: 5px;">
  <img src="assets/screens/alignment-screen-1.png">
  <img src="assets/screens/alignment-screen-2.png">
</div>

##

## Getting Started

Follow these steps to get **showcode** up and running on your local machine.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Ollama](https://ollama.ai/) (optional, if you want to run models locally)
- NVIDIA GPU with [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) (optional, for GPU acceleration)

### 1. Clone the Repository

```bash
git clone https://github.com/parthisduck/showcode.git
cd showcode
```

### 2. Setup Environment Variables

Copy the example environment file:

```bash
cp backend/.env.example backend/.env
```

Key variables in `backend/.env`:
- `OLLAMA_HOST`: URL of your Ollama instance (e.g., `http://host.docker.internal:11434`).
- `RSA_PRIVATE_KEY`: Your generated RSA private key (see next step).
- `DEMO_MODE`: Set to `True` to use the `SERVER_SIDE_API_KEY` for cloud models without requiring client-side keys.
- `SERVER_SIDE_API_KEY`: API key for a cloud LLM (optional).

### 3. Generate RSA Keys

The application uses RSA keys to securely handle API keys between the frontend and backend. Generate them using OpenSSL in the project root:

```bash
# Generate private key
openssl genrsa -out rsa_private.pem 2048

# Extract public key
openssl rsa -in rsa_private.pem -pubout -out rsa_public.pem
```

The `rsa_public.pem` file must remain in the root directory (it is mounted into the frontend and backend containers). 
Copy the **entire content** of `rsa_private.pem` (including the `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----` lines) and paste it as the value for `RSA_PRIVATE_KEY` in your `backend/.env`.

### 4. Start the Application

First, create the required Docker network:

```bash
docker network create app-network
```

Then, start the services:

```bash
docker compose up -d
```

The application will be available at:
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend:** [http://localhost:8000](http://localhost:8000)

> **Note:** If you make changes to `content.json` or the frontend files, you will need to rebuild the frontend container using `docker compose build frontend`.

### 5. (Optional) Run Ollama in Docker

If you don't have Ollama installed locally, you can run it using the provided configuration:

```bash
docker compose -f docker-compose.ollama.yml up -d
```

Then pull the recommended models:

```bash
docker exec -it ollama ollama pull qwen2.5-coder:3b
docker exec -it ollama ollama pull qwen2.5-coder:7b
```

## Customizing Content

The application displays projects based on the `content.json` file in the root directory. This file contains the metadata, code snippets, and system flow definitions for your projects. Modifying this file allows you to showcase your own work.

## Technical Notes

- **Models:** I am using `qwen2.5-coder:3b` (for snippet analysis) and `qwen2.5-coder:7b` (for industry alignment analysis). These offer a great balance of performance and quality for local development.
- **Hardware Specs:** This project was developed on a machine with 16GB RAM, Intel Core i5, and an NVIDIA GeForce GTX 1650 Ti (4GB VRAM).
- **Cloud Models:** There is built-in support for Gemini, Claude, OpenAI, and Grok if you prefer using cloud APIs.

For any suggestions on improving the code, especially the AI analysis, you can email me at parthisaduck004@duck.com

## Running Backend Tests

To run the backend tests locally, follow these steps:

1.  **Set up a virtual environment (optional but recommended):**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

2.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    pip install pytest
    ```

3.  **Run the tests:**

    ```bash
    pytest
    ```
