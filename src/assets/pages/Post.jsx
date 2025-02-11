
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Modal, Form, Card, Container, Row, Col } from "react-bootstrap";

const Products = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: 0,
    thumbnail: "",
  });

  // Fetch products
  const {
    data: products,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const response = await fetch("https://dummyjson.com/products");
        const data = await response.json();
        return data.products; // Extract the products array from the response
      } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch products");
      }
    },
  });

  const queryClient = useQueryClient();

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async ({ title, description, price, thumbnail }) => {
      const response = await fetch("https://dummyjson.com/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, price, thumbnail }),
      });
      return response.json();
    },
    onSuccess: (newProduct) => {
      queryClient.setQueryData(["products"], (curEle) => [
        newProduct,
        ...curEle,
      ]);
      setShowCreateForm(false);
      setNewProduct({ title: "", description: "", price: 0, thumbnail: "" });
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId) => {
      const response = await fetch(
        `https://dummyjson.com/products/${productId}`,
        {
          method: "DELETE",
        }
      );
      return response.json();
    },
    onSuccess: (data, productId) => {
      queryClient.setQueryData(["products"], (curEle) =>
        curEle.filter((product) => product.id !== productId)
      );
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async ({ productId, title, description, price, thumbnail }) => {
      const response = await fetch(
        `https://dummyjson.com/products/${productId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, price, thumbnail }),
        }
      );
      return response.json();
    },
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(["products"], (curEle) =>
        curEle.map((product) =>
          product.id === updatedProduct.id ? updatedProduct : product
        )
      );
    },
  });

  // Handle create button click
  const handleCreateClick = () => {
    setShowCreateForm(true);
  };

  // Handle create form submission
  const handleCreateFormSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(newProduct);
  };

  // Handle input changes in the create form
  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  // Handle update button click
  const handleUpdate = (
    productId,
    currentTitle,
    currentDescription,
    currentPrice,
    currentThumbnail
  ) => {
    const newTitle = prompt("Enter the new title:", currentTitle);
    const newDescription = prompt(
      "Enter the new description:",
      currentDescription
    );
    const newPrice = prompt("Enter the new price:", currentPrice);
    const newThumbnail = prompt(
      "Enter the new thumbnail URL:",
      currentThumbnail
    );

    if (newTitle && newDescription && newPrice && newThumbnail) {
      updateMutation.mutate({
        productId,
        title: newTitle,
        description: newDescription,
        price: newPrice,
        thumbnail: newThumbnail,
      });
    }
  };

  if (isPending) return <h1>Loading...</h1>;
  if (isError) return <h1>Error: {error.message}</h1>;

  return (
    <>
      {/* Create Product Button */}
      <Button variant="success" className="m-3" onClick={handleCreateClick}>
        Create Product
      </Button>

      {/* Create Product Form Modal */}
      <Modal show={showCreateForm} onHide={() => setShowCreateForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateFormSubmit}>
            <Form.Group controlId="formTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={newProduct.title}
                onChange={handleCreateInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={newProduct.description}
                onChange={handleCreateInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formPrice">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={newProduct.price}
                onChange={handleCreateInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formThumbnail">
              <Form.Label>Thumbnail URL</Form.Label>
              <Form.Control
                type="text"
                name="thumbnail"
                value={newProduct.thumbnail}
                onChange={handleCreateInputChange}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="mt-3">
              Create
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Display Products in a Grid */}
      <Container>
        <Row xs={1} md={2} lg={3} className="g-4">
          {products?.map(({ id, title, description, price, thumbnail }) => (
            <Col key={id}>
              <Card>
                <Card.Img variant="top" src={thumbnail} alt={title} />
                <Card.Body>
                  <Card.Title>{title}</Card.Title>
                  <Card.Text>{description}</Card.Text>
                  <Card.Text>Price: ${price}</Card.Text>
                  <Button
                    variant="warning"
                    className="me-2"
                    onClick={() =>
                      handleUpdate(id, title, description, price, thumbnail)
                    }
                  >
                    Update
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => deleteMutation.mutate(id)}
                  >
                    Delete
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default Products;