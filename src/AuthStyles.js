// src/AuthStyles.js
export const styles = {
  container: {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",

    backgroundImage:
      "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },

  // ⭐ FIXED: Now overlay does NOT block clicks or typing
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    pointerEvents: "none", // 💥 Required fix
    zIndex: 1,
  },

  p: {
    color: "#fff",
    textAlign: "center",
    marginTop: "15px",
  },

  box: {
    width: "100%",
    maxWidth: "400px",
    background: "#4742428f",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(5px)",
    zIndex: 5, // ⭐ Ensures above overlay
  },

  title: {
    textAlign: "center",
    color: "#fff",
    marginBottom: "25px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  input: {
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #ffffff44",
    backgroundColor: "#ffffff1a",
    color: "#fff",
    fontSize: "16px",
    outline: "none",
    zIndex: 10,
  },

  button: {
    marginTop: "5px",
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: "bold",
    transition: "background-color 0.3s",
    zIndex: 10,
  }
};
