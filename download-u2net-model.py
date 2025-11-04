"""
Download and Convert U²-Net Model
Downloads the actual U²-Net model and converts it to TensorFlow.js format
"""

import os
import requests
import torch
import tensorflowjs as tfjs
import numpy as np
from pathlib import Path

def download_u2net_model():
    """Download U²-Net model from GitHub releases"""
    print("🔄 Downloading U²-Net model...")
    
    # Create models directory
    model_dir = Path("./models/u2net")
    model_dir.mkdir(parents=True, exist_ok=True)
    
    # Model URLs (you'll need to get the actual download links)
    model_urls = {
        "u2net.pth": "https://drive.google.com/uc?export=download&id=1ao1ovG1Qtx4b7EoskHXmi2E9rp5CHLcZ",
        "u2netp.pth": "https://drive.google.com/uc?export=download&id=1ao1ovG1Qtx4b7EoskHXmi2E9rp5CHLcZ"
    }
    
    for model_name, url in model_urls.items():
        model_path = model_dir / model_name
        if not model_path.exists():
            print(f"📥 Downloading {model_name}...")
            try:
                response = requests.get(url, stream=True)
                response.raise_for_status()
                
                with open(model_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                print(f"✅ Downloaded {model_name}")
            except Exception as e:
                print(f"❌ Failed to download {model_name}: {e}")
        else:
            print(f"✅ {model_name} already exists")

def convert_to_tensorflowjs():
    """Convert PyTorch model to TensorFlow.js format"""
    print("🔄 Converting U²-Net to TensorFlow.js...")
    
    try:
        # Load PyTorch model
        model_path = "./models/u2net/u2net.pth"
        if not os.path.exists(model_path):
            print("❌ U²-Net model not found. Please download it first.")
            return False
        
        # Load the model
        model = torch.load(model_path, map_location='cpu')
        model.eval()
        
        # Create a dummy input for tracing
        dummy_input = torch.randn(1, 3, 320, 320)
        
        # Trace the model
        traced_model = torch.jit.trace(model, dummy_input)
        
        # Convert to TensorFlow.js
        tfjs_dir = "./models/u2net/tfjs"
        os.makedirs(tfjs_dir, exist_ok=True)
        
        tfjs.converters.pytorch_to_tfjs(traced_model, tfjs_dir)
        
        print("✅ U²-Net converted to TensorFlow.js format")
        print(f"📁 Model saved to: {tfjs_dir}")
        
        return True
        
    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        return False

def create_model_info():
    """Create model information file"""
    info = {
        "name": "U²-Net",
        "version": "1.0",
        "description": "U²-Net: Going Deeper with Nested U-Structure for Salient Object Detection",
        "paper": "Pattern Recognition 2020",
        "github": "https://github.com/xuebinqin/U-2-Net",
        "input_size": [320, 320, 3],
        "output_size": [320, 320, 1],
        "format": "TensorFlow.js",
        "files": {
            "model.json": "Model architecture",
            "model.weights.bin": "Model weights"
        }
    }
    
    import json
    with open("./models/u2net/model_info.json", "w") as f:
        json.dump(info, f, indent=2)
    
    print("✅ Model info created")

if __name__ == "__main__":
    print("🎨 U²-Net Model Setup")
    print("=" * 50)
    
    # Download model
    download_u2net_model()
    
    # Convert to TensorFlow.js
    if convert_to_tensorflowjs():
        create_model_info()
        print("\n🎉 U²-Net model setup completed!")
        print("💡 You can now use the real U²-Net model for professional background removal")
    else:
        print("\n❌ Model setup failed")
        print("💡 Please check the error messages above")







