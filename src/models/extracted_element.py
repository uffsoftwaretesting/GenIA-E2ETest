"""Model representing an HTML element extracted from a web page."""

from pydantic import BaseModel, Field


class ExtractedElement(BaseModel):
    """A single HTML element identified during browser extraction."""

    type: str = Field(
        ...,
        description=(
            "Specifies the HTML element type. "
            "Example: 'input', 'button', 'select', etc."
        ),
    )
    request_description: str = Field(
        ...,
        description=(
            "A detailed explanation of what the element asks from the user. "
            "Example: 'Enter your First Name'."
        ),
    )
    identifier_type: str = Field(
        ...,
        description=(
            "The method used to locate the HTML element. Preferably 'XPath', "
            "but can be ID, name, or other unique identifiers."
        ),
    )
    identifier_tracking: str = Field(
        ...,
        description=(
            "The exact path or unique identifier to locate the HTML element. "
            "For XPath, ensure it is the full and correct path. "
            'Example: \'//*[@id="root"]/div/div[2]/div/form/input[2]\'.'
        ),
    )
    step_name: str = Field(
        ...,
        description="Indicates which test case step utilizes this element during execution.",
    )
