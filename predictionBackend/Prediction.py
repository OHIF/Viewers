#import lungs_finder as lf
from flask import Flask, render_template, request
from werkzeug.utils import secure_filename
from keras.preprocessing.image import ImageDataGenerator
import tensorflow as tf
import numpy as np
import os
from cv2 import cv2
import matplotlib.pyplot as plt
import flask
from flask import jsonify


boneModel = tf.keras.models.load_model('densenet_mura_rs_v3_xr_forearm.h5')
lungCancerModel = tf.keras.models.load_model('cancer.h5')
pneumoniaModel = tf.keras.models.load_model('pneumonia.h5')


app = Flask(__name__)


def pneumoniaPrediction(image):

    npimg = np.fromstring(image, np.uint8)

    image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    np_image = np.array(image).astype('float32') / 255
    np_image = cv2.resize(np_image, (200, 200))
    np_image = np.expand_dims(np_image, axis=0)
    predict = pneumoniaModel.predict(np_image)[0]
    result = (predict[0])
    print(result)
    print(cv2.__version__)
    if(result > 0.5):
        predict = 'Abnormal'
        # found_lungs = lf.get_lungs(np_image)
        # right_lung_hog_rectangle = lf.find_right_lung_hog(found_lungs)
        # left_lung_hog_rectangle = lf.find_left_lung_hog(found_lungs)
        # right_lung_lbp_rectangle = lf.find_right_lung_lbp(found_lungs)
        # left_lung_lbp_rectangle = lf.find_left_lung_lbp(found_lungs)
        # right_lung_haar_rectangle = lf.find_right_lung_haar(found_lungs)
        # left_lung_haar_rectangle = lf.find_left_lung_haar(found_lungs)


        # if right_lung_hog_rectangle is not None:
        #     x, y, width, height = right_lung_hog_rectangle
        #     right_image = image[y:y + height, x:x + width]
        #     cv2.imshow("Right lung", right_image)
        #     code = cv2.waitKey(0)

    else:
        predict = 'Normal'

    data = {"data": [
        {
            "title": "Diagnose",
            "description": 'Pneumonia'
        },
        {
            "title": "Prediction Result",
            "description": predict
        },
        {
            "title": 'Operation',
            "description": 'Operation was successful'
        }
    ]}
    response = flask.jsonify(data)
    response.headers.add('Access-Control-Allow-Origin', '*')
    print(data)
    return response


def cancerPrediction(image):
    h = w = 224
    lst = []

    train_data = np.fromstring(image, np.uint8)
    # image = cv2.imdecode(npimg, cv2.COLOR_BGR2GRAY)
    # np_image = np.array(image).astype('float32')
    # np_image = cv2.resize(np_image, (224, 224))

    # np_image = np.expand_dims(np_image, axis=3)
    #train_data=cv2.imread('C:/Users/Admin/Pictures/1366x768 HD/island_3-wallpaper-1366x768.jpg')

    #train_data=cv2.imdecode(train_data, cv2.COLOR_BGR2GRAY)

    train_data = cv2.resize(train_data, (h, w))
    lst.append(train_data)
    lst = np.array(lst)
    lst = lst.astype('float32')

    lst = np.expand_dims(lst, axis=3)
    predict = lungCancerModel.predict_classes(lst)[0]
    result = (predict)
    print(result)
    if (result == 0):
        predict = 'Abnormal'
    elif (predict == 1):
        predict = 'Normal'

    data = {"data": [
        {
            "title": "Diagnose",
            "description": 'Lung Cancer'
        },
        {
            "title": "Prediction result",
            "description": predict
        },
        {
            "title": 'Operation',
            "description": 'Operation was successful'
        }
    ]}
    response = flask.jsonify(data)
    response.headers.add('Access-Control-Allow-Origin', '*')
    print(data)
    return response


def bonePrediction(image, target):

    npimg = np.fromstring(image, np.uint8)
    image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    np_image = np.array(image).astype('float32') / 255
    np_image = cv2.resize(np_image, (224, 224))
    np_image = np.expand_dims(np_image, axis=0)
    predict = boneModel.predict(np_image)[0]
    result = (predict[0])


    if(result > 0.5):
        predict = 'Abnormal'
    else:
        predict = 'Normal'

    data = {"data": [
        {
            "title": "Diagnose",
            "description": 'Borne Abnormalities'
        },
        {
            "title": "Prediction result",
            "description": predict
        },
        {
            "title": 'Operation',
            "description": 'Operation was successful'
        }
    ]}
    response = flask.jsonify(data)

    response.headers.add('Access-Control-Allow-Origin', '*')
    print(data)

    return response


@app.route('/prediction', methods=['GET', 'POST'])
def predict():
    # initialize the data dictionary that will be returned from the
    # view
    data = {"data": [{
        "title": 'Operation',
        "description": 'Internal Server Error'
    }]}
    try:
        if request.method == 'POST':
            if flask.request.files.get("image"):
                result = ''
                image = request.files['image'].read()
                predictionModel = str(request.form['modelId'])
                if(predictionModel == '1'):
                    result = bonePrediction(image, target=(224, 224))

                elif (predictionModel == '2'):
                    result = cancerPrediction(image)

                elif (predictionModel == '3'):
                    result = pneumoniaPrediction(image)

                return (result)
    except Exception as e:

        print(e)
        # return flask.jsonify(e)


if __name__ == '__main__':
    app.run()
