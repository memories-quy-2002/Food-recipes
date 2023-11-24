import React, { useState } from "react";
import axios from "../../api/axios";
import { Form, Button } from "react-bootstrap";
const AddRecipe = () => {
	const [formRecipe, setFormRecipe] = useState({
		recipeImage: null,
		recipeName: "",
		recipeCategoryName: "",
		recipeMealName: "",
		recipeDescription: "",
	});
	const [disabled, setDisabled] = useState(true);
	const handleFileChange = (event) => {
		setDisabled(false);
		const file = event.target.files[0];
		setFormRecipe({ ...formRecipe, recipeImage: file });
	};
	const handleInputChange = (event) => {
		setDisabled(false);
		const { name, value } = event.target;
		setFormRecipe({
			...formRecipe,
			[name]: value,
		});
	};
	const handleSubmit = async (event) => {
		event.preventDefault();

		if (formRecipe.recipeImage) {
			const formData = new FormData();
			formData.append("recipeImage", formRecipe.recipeImage);
			formData.append("recipeName", formRecipe.recipeName);
			formData.append(
				"recipeCategoryName",
				formRecipe.recipeCategoryName
			);
			formData.append("recipeMealName", formRecipe.recipeMealName);
			formData.append("recipeDescription", formRecipe.recipeDescription);

			try {
				const response = await axios.post("/recipe/add", formData, {
					headers: {
						"Content-Type": "multipart/form-data",
					},
				});

				if (response.status === 200) {
					console.log("File uploaded successfully");
				} else {
					console.error("Failed to upload file");
				}
			} catch (error) {
				console.error("Error uploading file:", error);
			}
		}
	};

	return (
		<Form
			onSubmit={handleSubmit}
			encType="multipart/form-data"
			method="POST"
			className="add__container__form"
		>
			<Form.Group
				controlId="formRecipeImage"
				className="add__container__form__field"
			>
				<Form.Label>Recipe Image</Form.Label>
				<Form.Control
					type="file"
					name="recipeImage"
					onChange={handleFileChange}
				/>
			</Form.Group>
			<Form.Group
				controlId="formRecipeName"
				className="add__container__form__field"
			>
				<Form.Label>Recipe Name</Form.Label>
				<Form.Control
					type="text"
					name="recipeName"
					value={formRecipe.recipeName}
					onChange={handleInputChange}
				/>
			</Form.Group>
			<Form.Group
				controlId="formRecipeCategoryName"
				className="add__container__form__field"
			>
				<Form.Label>Category</Form.Label>
				<Form.Control
					type="text"
					name="recipeCategoryName"
					value={formRecipe.recipeCategoryName}
					onChange={handleInputChange}
				/>
			</Form.Group>
			<Form.Group
				controlId="formRecipeMealName"
				className="add__container__form__field"
			>
				<Form.Label>Meal</Form.Label>
				<Form.Control
					type="text"
					name="recipeMealName"
					value={formRecipe.recipeMealName}
					onChange={handleInputChange}
				/>
			</Form.Group>
			<Form.Group
				controlId="formRecipeDescription"
				className="add__container__form__field"
			>
				<Form.Label>Description</Form.Label>
				<Form.Control
					as="textarea"
					rows={5}
					name="recipeDescription"
					value={formRecipe.recipeDescription}
					onChange={handleInputChange}
				/>
			</Form.Group>

			<div style={{ textAlign: "right" }}>
				<Button
					type="submit"
					className="add__container__form__submit"
					disabled={disabled}
				>
					Save Changes
				</Button>
			</div>
		</Form>
	);
};

export default AddRecipe;
