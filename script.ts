interface FormField {
    id: string;
    type: string;
    label: string;
    options?: string[];
    required?: boolean;
}

interface FormResponse {
    formId: string;
    responses: Record<string, any>;
}

class FormBuilder {
    formFields: FormField[] = [];
    currentFormId: string = '';
    formResponses: FormResponse[] = [];

    constructor() {
        this.loadForms();
        this.attachEventListeners();
    }

    // Load forms and responses from localStorage
    loadForms() {
        const forms = JSON.parse(localStorage.getItem('forms') || '[]');
        const responses = JSON.parse(localStorage.getItem('formResponses') || '[]');
        this.formFields = forms.length ? forms : [];
        this.formResponses = responses.length ? responses : [];
        this.renderForm();
        this.renderForms();
        this.renderResponses();
    }

    // Attach event listeners to DOM elements
    attachEventListeners() {
        const addFieldButton = document.getElementById('add-field') as HTMLButtonElement;
        const submitFormButton = document.getElementById('submit-form') as HTMLButtonElement;
        const fieldTypeSelect = document.getElementById('field-type') as HTMLSelectElement;
        const fieldLabelInput = document.getElementById('field-label') as HTMLInputElement;
        const fieldOptionsInput = document.getElementById('field-options-input') as HTMLInputElement;
        const fieldOptionsContainer = document.getElementById('field-options') as HTMLElement;
        const errorMessageContainer = document.getElementById('error-message') as HTMLElement;

        addFieldButton.addEventListener('click', () => {
            const label = fieldLabelInput.value;
            const type = fieldTypeSelect.value;
            const required = confirm("Is this field required?");
            
            if (!this.isValidLabel(label)) {
                errorMessageContainer.textContent = "Field label is invalid or already exists. Please choose a different label.";
                errorMessageContainer.style.color = 'red';
                return; // Prevent adding the field
            }

            let options: string[] | undefined = undefined;

            if (type === 'radio' || type === 'checkbox') {
                options = fieldOptionsInput.value.split(',').map((opt) => opt.trim());
            }

            const field: FormField = {
                id: `${type}-${Date.now()}`,
                type,
                label,
                options,
                required
            };

            this.addField(field);
            fieldLabelInput.value = '';
            fieldOptionsInput.value = '';
            errorMessageContainer.textContent = ''; // Clear any previous error messages
        });

        submitFormButton.addEventListener('click', () => {
            if (this.validateForm()) {
                this.submitForm();
            }
        });

        fieldTypeSelect.addEventListener('change', () => {
            if (fieldTypeSelect.value === 'radio' || fieldTypeSelect.value === 'checkbox') {
                fieldOptionsContainer.classList.remove('hidden');
            } else {
                fieldOptionsContainer.classList.add('hidden');
            }
        });
    }

    // Check if the label is valid (non-empty and unique)
    isValidLabel(label: string): boolean {
        if (!label.trim()) {
            return false; // Empty label is invalid
        }

        // Check if label already exists in the form fields
        const exists = this.formFields.some((field) => field.label.toLowerCase() === label.toLowerCase());
        return !exists;
    }

    // Add a new field to the form
    addField(field: FormField) {
        this.formFields.push(field);
        this.saveForms();
        this.renderForm();
    }

    // Save forms to localStorage
    saveForms() {
        localStorage.setItem('forms', JSON.stringify(this.formFields));
    }

    // Edit a field
    editField(id: string) {
        const field = this.formFields.find((field) => field.id === id);
        if (field) {
            const newLabel = prompt("Enter new label:", field.label);
            if (newLabel !== null) {
                field.label = newLabel;
                this.saveForms();
                this.renderForm();
                this.renderResponses();
            }
        }
    }

    // Delete a field
    deleteField(id: string) {
        this.formFields = this.formFields.filter((field) => field.id !== id);
        this.saveForms();
        this.renderForm();
        this.renderResponses();
    }

    // Validate form to check if required fields are filled
    validateForm(): boolean {
        let valid = true;

        this.formFields.forEach((field) => {
            const input = document.querySelector(`#${field.id}`) as HTMLInputElement;

            if (field.required) {
                if (field.type === 'text' && !input.value) {
                    valid = false;
                    input.classList.add('error');
                } else if (field.type === 'radio' && !document.querySelector(`input[name="${field.id}"]:checked`)) {
                    valid = false;
                    input.classList.add('error');
                } else if (field.type === 'checkbox' && !document.querySelector(`input[name="${field.id}"]:checked`)) {
                    valid = false;
                    input.classList.add('error');
                }else {
                    input.classList.remove('error');
                }
            } else {
                input.classList.remove('error');
            }
        });

        return valid;
    }

    // Submit the form and store the responses
    submitForm() {
        const responses: Record<string, any> = {};

        this.formFields.forEach((field) => {
            const input = document.querySelector(`#${field.id}`) as HTMLInputElement;
            if (field.type === 'text') {
                responses[field.label] = input.value;
            } else if (field.type === 'radio') {
                const selectedRadio = document.querySelector(`input[name="${field.id}"]:checked`) as HTMLInputElement;
                if (selectedRadio) {
                    responses[field.label] = selectedRadio.value;
                }
            } else if (field.type === 'checkbox') {
                const selectedCheckboxes = document.querySelectorAll(`input[name="${field.id}"]:checked`) as NodeListOf<HTMLInputElement>;
                responses[field.label] = Array.from(selectedCheckboxes).map((checkbox) => checkbox.value);
            }
        });

        const formResponse: FormResponse = {
            formId: `${Date.now()}`,
            responses,
        };

        this.formResponses.push(formResponse);
        localStorage.setItem('formResponses', JSON.stringify(this.formResponses));
        this.renderResponses();
    }

    // Render the form preview
    renderForm() {
        const formContainer = document.getElementById('form')!;
        formContainer.innerHTML = '';

        this.formFields.forEach((field) => {
            const fieldElement = document.createElement('div');
            fieldElement.classList.add('form-field');

            const labelElement = document.createElement('label');
            labelElement.textContent = field.label;
            fieldElement.appendChild(labelElement);

            if (field.type === 'text') {
                const input = document.createElement('input');
                input.type = 'text';
                input.id = field.id;
                input.required = field.required || false;
                fieldElement.appendChild(input);
            } else if (field.type === 'radio') {
                field.options?.forEach((option) => {
                    const radioLabel = document.createElement('label');
                    const radioInput = document.createElement('input');
                    radioInput.type = 'radio';
                    radioInput.name = field.id;
                    radioInput.value = option;
                    radioLabel.appendChild(radioInput);
                    radioLabel.appendChild(document.createTextNode(option));
                    fieldElement.appendChild(radioLabel);
                });
            } else if (field.type === 'checkbox') {
                field.options?.forEach((option) => {
                    const checkboxLabel = document.createElement('label');
                    const checkboxInput = document.createElement('input');
                    checkboxInput.type = 'checkbox';
                    checkboxInput.name = field.id;
                    checkboxInput.value = option;
                    checkboxLabel.appendChild(checkboxInput);
                    checkboxLabel.appendChild(document.createTextNode(option));
                    fieldElement.appendChild(checkboxLabel);
                });
            }

            // Add edit and delete buttons
            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('actions');
            
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('edit');
            editButton.onclick = () => this.editField(field.id);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete');
            deleteButton.onclick = () => this.deleteField(field.id);

            actionsDiv.appendChild(editButton);
            actionsDiv.appendChild(deleteButton);
            fieldElement.appendChild(actionsDiv);

            formContainer.appendChild(fieldElement);
        });
    }

    // Render saved forms in the list
    renderForms() {
        const formList = document.getElementById('form-list')!;
        formList.innerHTML = '';

        this.formFields.forEach((field) => {
            const formDiv = document.createElement('div');
            formDiv.textContent = `Form with ${field.label}`;
            formList.appendChild(formDiv);
        });
    }

    // Render submitted responses in a table format
    renderResponses() {
        const responseReview = document.getElementById('response-review')!;
        responseReview.innerHTML = '';

        if (this.formResponses.length > 0 && this.formFields.length) {
            const table = document.createElement('table');
            const headerRow = document.createElement('tr');
            const headerFormId = document.createElement('th');
            headerFormId.textContent = 'Form ID';
            headerRow.appendChild(headerFormId);

            // Add field labels as table headers
            this.formFields.forEach((field) => {
                const header = document.createElement('th');
                header.textContent = field.label;
                headerRow.appendChild(header);
            });

            table.appendChild(headerRow);

            this.formResponses.forEach((response) => {
                const row = document.createElement('tr');
                const formIdCell = document.createElement('td');
                formIdCell.textContent = response.formId;
                row.appendChild(formIdCell);

                // Add response values as table data cells
                this.formFields.forEach((field) => {
                    const cell = document.createElement('td');
                    const responseValue = response.responses[field.label];
                    cell.textContent = Array.isArray(responseValue)
                        ? responseValue.join(', ')
                        : responseValue;
                    row.appendChild(cell);
                });

                table.appendChild(row);
            });

            responseReview.appendChild(table);
        }else{
            this.formResponses.length=0;
            this.formFields.length=0;
        localStorage.clear();
        }
    }
}

const formBuilder = new FormBuilder();

