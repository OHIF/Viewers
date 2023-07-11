# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

from apiron import JsonEndpoint, Service

__all__ = ["OrthancModalities"]


class OrthancModalities(Service):

    modalities = JsonEndpoint(path="modalities/")
    modality = JsonEndpoint(path="modalities/{dicom}/")
    del_modality = JsonEndpoint(path="modalities/{dicom}/", default_method="DELETE")
    put_modality = JsonEndpoint(path="modalities/{dicom}/", default_method="PUT")
    echo = JsonEndpoint(path="modalities/{dicom}/echo/", default_method="POST")
    move = JsonEndpoint(path="modalities/{dicom}/move/", default_method="POST")
    query = JsonEndpoint(path="modalities/{dicom}/query/", default_method="POST")
    store = JsonEndpoint(path="modalities/{dicom}/store/", default_method="POST")
