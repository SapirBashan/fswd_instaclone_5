import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserAPI } from "../utils/ServerDB";
import { UserStorage } from "../utils/LocalStorage";

const ProfileCompletion = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    phone: "",
    website: "",
    company: {
      name: "",
      catchPhrase: "",
      bs: ""
    },
    address: {
      street: "",
      suite: "",
      city: "",
      zipcode: "",
      geo: {
        lat: "",
        lng: ""
      }
    }
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("personal"); // 'personal', 'address', 'company'
  
  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await UserAPI.getById(userId);
        setUser(userData);
        
        // Pre-fill any existing data
        setFormData({
          phone: userData.phone || "",
          website: userData.website || "",
          company: {
            name: userData.company?.name || "",
            catchPhrase: userData.company?.catchPhrase || "",
            bs: userData.company?.bs || ""
          },
          address: {
            street: userData.address?.street || "",
            suite: userData.address?.suite || "",
            city: userData.address?.city || "",
            zipcode: userData.address?.zipcode || "",
            geo: {
              lat: userData.address?.geo?.lat || "",
              lng: userData.address?.geo?.lng || ""
            }
          }
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Could not load user data");
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [userId]);
  
  // Change handlers
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [name]: value }
    }));
  };
  
  const handleGeoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        geo: { ...prev.address.geo, [name]: value }
      }
    }));
  };
  
  // Add the missing handleCompanyChange function
  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      company: { ...prev.company, [name]: value }
    }));
  };
  
  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Update user data
      const updatedUser = await UserAPI.update(userId, {
        ...user,
        phone: formData.phone,
        website: user.website, // Keep the password intact
        company: formData.company,
        address: formData.address
      });
      
      // Update in local storage
      const currentUser = UserStorage.getUser();
      UserStorage.saveUser({
        ...currentUser,
        phone: updatedUser.phone,
        company: updatedUser.company,
        address: updatedUser.address
      }, true);
      
      // Navigate to home using React Router
      navigate('/home');
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
      setIsLoading(false);
    }
  };
  
  // Skip profile completion
  const handleSkip = () => {
    navigate('/home');
  };
  
  return {
    user,
    formData,
    error,
    isLoading,
    activeSection,
    setActiveSection,
    handlePersonalChange,
    handleAddressChange,
    handleGeoChange,
    handleCompanyChange,
    handleSubmit,
    handleSkip
  };
};

export default ProfileCompletion;