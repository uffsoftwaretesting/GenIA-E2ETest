from crawl4ai import WebCrawler
from crawl4ai.web_crawler import WebCrawler
from crawl4ai.chunking_strategy import *
from crawl4ai.extraction_strategy import *
from crawl4ai.crawler_strategy import *
from pydantic import BaseModel, Field
from bs4 import BeautifulSoup
from openai import OpenAI
import openai
import os
from dotenv import load_dotenv


load_dotenv()

api_key_string = os.getenv("OPENAI_API_KEY")

print(api_key_string)
class OpenAIModelForm(BaseModel):
    type: str = Field(
        ..., 
        description="Specifies the HTML element type. Example: 'input', 'button', 'select', etc."
    )
    request_description: str = Field(
        ..., 
        description="A detailed explanation of what the form element asks from the user. Example: 'Enter your First Name'."
    )
    identifier_type: str = Field(
        ..., 
        description="The method used to locate the HTML element. Preferably 'XPath', but can be ID, name, or other unique identifiers."
    )
    identifier_tracking: str = Field(
        ..., 
        description="""The exact path or unique identifier to locate the HTML element. For XPath, ensure it's the full and correct path. Example: '//*[@id="root"]/div/div[2]/div/form/input[2]'."""
    )
    naming: str = Field(
        ..., 
        description="A concise and meaningful variable name representing the element in code. Example: 'input_first_name'."
    )

crawler = WebCrawler()

crawler.warmup()

url = r'https://automationexercise.com/'

json_result = crawler.run(
    url=url,
    word_count_threshold=1,
    css_selector="div",
    extraction_strategy= LLMExtractionStrategy(
        provider= "openai/gpt-4o", api_token= api_key_string, 
        schema=OpenAIModelForm.model_json_schema(),
        extraction_type="schema",
        instruction = """

        You must analyze the web page content and identify all elements that the user needs to fill out or select. For each element found, extract the following data:
        
        1. **type**: The type of the form element, such as "input", "select", "button", etc.
        2. **request_description**: A clear description of what the field asks from the user. For example, if it's a field for entering a name, the description would be "Field to enter the Name".
        3. **identifier_type**: The method to identify the element on the page, preferably using the XPath for precise identification.
        4. **identifier_tracking**: The exact path or identifier (such as XPath or ID) that can be used to locate the element in the HTML structure.
        5. **naming**: A clear and simple name to represent this element in the automation code, such as "input_name", "input_email", etc.

        When creating the XPath path for each element, follow these general instructions:

        1. **Start from the root of the DOM structure**: The XPath should always begin with `/html/body/...` to represent the full path from the top-level of the document down to the target element.
        2. **Navigate through each container or division**: Identify each `div`, `form`, or other parent containers that hold the target element. If these elements have unique identifiers (like `id` or `class`), use them to make the XPath more precise.
        3. **Use attributes like `id`, `name`, or `class` when available**: If the target element has an ID or other unique attributes, incorporate them into the XPath. For example, use `input[@id='input_sobrenome']` to specify the exact input element.
        4. **Specify the exact position of elements when necessary**: If there are multiple similar elements (e.g., multiple `input` fields), use the position in the DOM tree to differentiate them, like `input[2]` for the second input field.
        5. **Ensure the XPath is exact and represents the actual structure of the HTML**: The XPath should be verified for accuracy and ensure it matches the structure of the form in the HTML.

        Example of form field extraction in JSON format:
        {
            "type": "input",
            "request_description": "Field to enter the Name",
            "identifier_type": "XPath",
            "identifier_tracking": "//*[@id='root']/div/div[2]/div/form/input[1]",
            "naming": "input_name"
        }

        Task: Analyze the form and extract all elements the user must interact with, including inputs, submit buttons, selections, and any other relevant fields. Ensure each element is correctly identified and associated with its XPath. Ensure the XPath is accurate, corresponding exactly to the actual HTML structure.

        Example of identifying the correct XPath for elements:

        HTML Code:
        <html>
            <body>
                <div>
                    <form>
                        <input type="text" name="first_name" id="first_name" placeholder="First Name">
                    </form>
                    <button id="submit_form">
                        <img src="src/assets/sign_up_button.svg">
                    </button>
                </div>
            </body>
        </html>

        Resulting JSON:
        [
            {
                "type": "input",
                "request_description": "Field to enter the First Name",
                "identifier_type": "Full XPath",
                "identifier_tracking": "/html/body/div/form/input",
                "naming": "input_first_name"
            },
            {
                "type": "button",
                "request_description": "Button to sign up",
                "identifier_type": "Full XPath",
                "identifier_tracking": "//*[@id='submit_form']/img[1]",
                "naming": "button_sign_up"
            }
        ]

        Notes:
        Return each element's data in a structured JSON format.
        Do not omit any elements required for user interaction.

        """
    ),
    bypass_cache=True,
    verbose= True, 
)

json_result = json_result.extracted_content

html_result = BeautifulSoup(crawler.run(url).html, 'html.parser')

html_body = (html_result.body).prettify

client = openai.OpenAI(api_key=api_key_string)

completion = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", 
         "content": f"According to the following HTML code: {html_body}, enhance this list of json objects: {json_result} with the correct Absolute Xpath of each HTML element listed. Take into account the elements of the Header so as not to alter the true path, do not disregard any HTML element so that there are no errors in the result. Return only the list of json objects, no comments or feedbacks, just the []. Take into account that this result will be used to perform software tests with HTML elements, so the veracity of the information is essential."}
    ]
)

output_dir = ".dataOpenAI"

def generate_unique_json_filename(directory, base_name, extension="json"):
    counter = 1
    while True:
        file_name = f"{base_name}{counter}.{extension}"
        full_path = os.path.join(directory, file_name)
        if not os.path.exists(full_path):
            return full_path
        counter += 1

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

unique_filename = generate_unique_json_filename(output_dir, "dataOpenAI")

with open(unique_filename, "w", encoding="utf-8") as f:
    f.write(completion.choices[0].message.content)

with open("signUp.feature", "r", encoding="utf-8") as file:
    signUp_content = file.read()

with open("signIn.feature", "r", encoding="utf-8") as file:
    signIn_content = file.read()

completion_final = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {   "role": "user", 
            "content": f"According to the following user story: {signIn_content}, and the list of JSON objects: {completion.choices[0].message.content}, create the 'example' attribute and add to it a list of strings containing example responses for each index of the list.\n\n" 
            "Example:\n"
            "[\n"
            "    {\n"
            "        \"type\": \"input\",\n"
            "        \"request_description\": \"Field to enter the Name\",\n"
            "        \"identifier_type\": \"XPath\",\n"
            "        \"identifier_tracking\": \"/html/body/div/div/div/div[2]/form/input[1]\",\n"
            "        \"naming\": \"input_name\",\n"
            "        \"error\": false,\n"
            "        \"example\": [\"Maria\", \"João\"]\n"
            "    },\n"
            "    {\n"
            "        \"type\": \"input\",\n"
            "        \"request_description\": \"Field to enter the Surname\",\n"
            "        \"identifier_type\": \"XPath\",\n"
            "        \"identifier_tracking\": \"/html/body/div/div/div/div[2]/form/input[2]\",\n"
            "        \"naming\": \"input_surname\",\n"
            "        \"error\": false,\n"
            "        \"example\": [\"Silva\", \"Cardoso\"]\n"
            "    }\n"
            "]"
        }
    ]
)

output_dir_final = ".dataOpenAIFinal"

def generate_unique_json_filename(directory, base_name, extension="json"):
    counter = 1
    while True:
        file_name = f"{base_name}{counter}.{extension}"
        full_path = os.path.join(directory, file_name)
        if not os.path.exists(full_path):
            return full_path
        counter += 1

if not os.path.exists(output_dir_final):
    os.makedirs(output_dir_final)

unique_filename = generate_unique_json_filename(output_dir_final, "dataOpenAIFinal")

with open(unique_filename, "w", encoding="utf-8") as f:
    f.write(completion_final.choices[0].message.content)


robot_test = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "user", 
            "content": f"According to the following user story: {signIn_content}, URL: {url}, and the list of JSON objects: {completion_final.choices[0].message.content}, create an E2E test script using Python, Robot Framework, and Selenium for the Test Case."
        }
    ]
)

robot_file = ".robot"

def generate_unique_filename(directory, base_name, extension="robot"):
    counter = 1
    while True:
        file_name = f"{base_name}{counter}.{extension}"
        full_path = os.path.join(directory, file_name)
        if not os.path.exists(full_path):
            return full_path
        counter += 1

if not os.path.exists(robot_file):
    os.makedirs(robot_file)

unique_filename = generate_unique_filename(robot_file, "test")

with open(unique_filename, "w", encoding="utf-8") as f:
    f.write(robot_test.choices[0].message.content)




