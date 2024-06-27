from mlxtend.plotting import plot_confusion_matrix
import matplotlib.pyplot as plt
import numpy as np

binary1 = np.array([[7, 1],
                   [0, 6]])

class_names = ['yes', 'no']

fig, ax = plot_confusion_matrix(conf_mat=binary1,class_names=class_names,colorbar=True)

plt.show()