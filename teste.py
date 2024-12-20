from crawl4ai import WebCrawler
from crawl4ai.web_crawler import WebCrawler
from crawl4ai.chunking_strategy import *
from crawl4ai.extraction_strategy import *
from crawl4ai.crawler_strategy import *
from pydantic import BaseModel, Field
from bs4 import BeautifulSoup
import openai
import os
from dotenv import load_dotenv

output_dir_Crawl4AI = ".dataCrawL4AI"

if not os.path.exists(output_dir_Crawl4AI):
    os.makedirs(output_dir_Crawl4AI)

def generate_unique_json_filename_CrawL4AI(directory, base_name, extension="json"):
    counter = 1
    while True:
        file_name = f"{base_name}{counter}.{extension}"
        full_path = os.path.join(directory, file_name)
        if not os.path.exists(full_path):
            return full_path
        counter += 1

unique_filename_Crawl4AI = generate_unique_json_filename_CrawL4AI(output_dir_Crawl4AI, "dataCrawl4AI")

output_dir_OpenAI = ".dataOpenAI"

if not os.path.exists(output_dir_OpenAI):
    os.makedirs(output_dir_OpenAI)

def generate_unique_json_filename_OpenAI(directory, base_name, extension="json"):
    counter = 1
    while True:
        file_name = f"{base_name}{counter}.{extension}"
        full_path = os.path.join(directory, file_name)
        if not os.path.exists(full_path):
            return full_path
        counter += 1

unique_filename_OpenAI = generate_unique_json_filename_OpenAI(output_dir_OpenAI, "dataOpenAI")

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

# url1 = r'https://automationexercise.com/'

load_dotenv()

url = os.getenv("URL")

test_case_file = os.getenv("TEST_CASE")

# test_case_file = "Test_Case_3.feature"

with open(test_case_file, "r", encoding="utf-8") as file:
    test_case = file.read()

api_key_string = os.getenv("OPENAI_API_KEY")

print (url)
print (test_case)
print (api_key_string)


class OpenAIModelForm(BaseModel):
    type: str = Field(
        ..., 
        description="Specifies the HTML element type. Example: 'input', 'button', 'select', etc."
    )
    request_description: str = Field(
        ..., 
        description="A detailed explanation of what the element asks from the user. Example: 'Enter your First Name'."
    )
    identifier_type: str = Field(
        ..., 
        description="The method used to locate the HTML element. Preferably 'XPath', but can be ID, name, or other unique identifiers."
    )
    identifier_tracking: str = Field(
        ..., 
        description="""The exact path or unique identifier to locate the HTML element. For XPath, ensure it's the full and correct path. Example: '//*[@id="root"]/div/div[2]/div/form/input[2]'."""
    )

crawler = WebCrawler()

crawler.warmup()

json_result = crawler.run(
    url=url,
    word_count_threshold=1,
    css_selector="div",
    extraction_strategy= LLMExtractionStrategy(
        provider= "openai/gpt-3.5-turbo", api_token= api_key_string, 
        schema=OpenAIModelForm.model_json_schema(),
        extraction_type="schema",
        instruction = 
            """ Analyze the web page content and identify only the elements that are essential for creating an efficient End-To-End testing script for the following Test Case: {test_case}. For each identified element, extract the following details:

            1. **type**: The type of form element (e.g., "input", "select", "button", etc.).
            2. **request_description**: A clear description of what the element requires from the user (e.g., "Field to enter the Name").
            3. **identifier_type**: The method used to identify the element (preferably using XPath for precise identification).
            4. **identifier_tracking**: The exact path or identifier (e.g., XPath or ID) to locate the element in the HTML structure.

            Example extraction in JSON format:

            [
                {
                    "type": "input",
                    "request_description": "Field to enter the First Name",
                    "identifier_type": "Full XPath",
                    "identifier_tracking": "/html/body/div/form/input",
                },
                {
                    "type": "button",
                    "request_description": "Button to sign up",
                    "identifier_type": "Full XPath",
                    "identifier_tracking": "//*[@id='submit_form']/img[1]",
                }
            ]

            Task: Analyze the form and extract all relevant elements needed for the QA tester, including inputs, buttons, selections, checkboxes, links, and other essential elements. Ensure that each element is accurately identified and that its XPath corresponds exactly to the HTML structure.

            Notes:
            Return each element's data in a structured JSON format.
            Do not omit any elements necessary to complete the test case."""
    ),
    bypass_cache=True,
    verbose= True, 
)

json_result = json_result.extracted_content

with open(unique_filename_Crawl4AI, "w", encoding="utf-8") as f:
    f.write(json_result)

html_result = BeautifulSoup(crawler.run(url).html, 'html.parser')

html_body = (html_result.body).prettify

client = openai.OpenAI(api_key=api_key_string)



# response = client.beta.chat.completions.parse(
#     model="gpt-4o",
#     messages=[
#         {"role": "system", "content": "You are an experienced software tester. Your task is to help the user refine the JSON object list by analyzing the HTML structure and ensuring that the XPath expressions for the required elements in the test case are correct and error-free."},
#         {"role": "user", "content": 
#             f"Given the following test case: {test_case}, the HTML code: {html_body}, and the JSON result: {json_result}, analyze the HTML structure and improve the list of JSON objects to ensure there are no errors in the XPath expressions for the required elements in the test case."}
#     ]
# )

print (test_case)
print (html_body)
print (json_result)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "system",
            "content": "You are an experienced software tester. Your task is to help the user refine the JSON object list by analyzing the HTML structure and ensuring that the XPath expressions for the required elements in the test case are correct and error-free."
        },
        {
            "role": "user",
            "content": "Given the following test case: {test_case}, the HTML code: {html_body}, and the JSON result: {json_result}, analyze the HTML structure and improve the list of JSON objects to ensure there are no errors in the XPath expressions for the required elements in the test case."
        }
    ]
)

json_result_final = response.choices[0].message.content

with open(unique_filename_OpenAI, "w", encoding="utf-8") as f:
    f.write(json_result_final)

robot_test = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a skilled test automation engineer. Your task is to guide the user in creating an end-to-end (E2E) test script using Python, Robot Framework, and Selenium based on the provided test case, HTML code, and list of JSON objects."},
        {"role": "user", "content": 
        f"""Based on the following test case: {test_case}, HTML code: {html_body}, and the final list of JSON objects: {json_result_final}, generate an E2E test script using Python, Robot Framework, and Selenium for the test case.
        Please provide the test code in the format below:
        ```robot framework
        
        Test Script
        
        ```
        """}
    ]
)

with open(unique_filename, "w", encoding="utf-8") as f:
    f.write(robot_test.choices[0].message.content)





