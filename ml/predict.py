import sys
import joblib

# Load model and vectorizer
model = joblib.load('machine-learning/projects/Pickling/rf_model_pickle.pkl')
vectorizer = joblib.load('machine-learning/projects/Pickling/rf_vectorizer_pickle.pkl')

# Read input message from command line
if len(sys.argv) < 2:
    print("Error: No message provided")
    sys.exit(1)

message = sys.argv[1]

# Vectorize the input
X = vectorizer.transform([message])

# Predict
prediction = model.predict(X)

# Output result
print("smishing" if prediction[0] == 1 else "safe")
