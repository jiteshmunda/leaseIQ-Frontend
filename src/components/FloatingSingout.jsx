import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {Button, Modal} from "react-bootstrap";
import "../styles/signout.css";

const DRAG_THRESHOLD = 5; // px

const FloatingSignOut = () => {
  const navigate = useNavigate();

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showConfirm, setShowConfirm] = useState(false);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    dragging.current = true;
    didDrag.current = false;

    dragStart.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    };
  };

  const onMouseMove = (e) => {
    if (!dragging.current) return;

    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;

    if (
      Math.abs(newX - offset.x) > DRAG_THRESHOLD ||
      Math.abs(newY - offset.y) > DRAG_THRESHOLD
    ) {
      didDrag.current = true;
    }

    setOffset({ x: newX, y: newY });
  };

  const onMouseUp = () => {
    dragging.current = false;
  };

  const handleClick = () => {
    if (didDrag.current) return; 

    setShowConfirm(true);
  };

  const handleCancelLogout = () => {
    setShowConfirm(false);
  };

  const handleConfirmLogout = () => {
    setShowConfirm(false);
    sessionStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <>
      <div
        className="floating-signout"
        style={{
          right: 24,
          bottom: 24,
          transform: `translate(-${offset.x}px, -${offset.y}px)`,
        }}
        onMouseDown={onMouseDown}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Sign out"
      >
        <LogOut size={20} />
      </div>

      <Modal show={showConfirm} onHide={handleCancelLogout} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to <b>logout</b> ?</Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCancelLogout}>
            Cancel
          </Button>
          <Button variant="outline-danger" onClick={handleConfirmLogout}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FloatingSignOut;
